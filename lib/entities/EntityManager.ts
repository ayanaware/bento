import { IllegalArgumentError, IllegalStateError, ProcessingError } from '@ayanaware/errors';

import type { Bento } from '../Bento';
import { getChildOf } from '../decorators/ChildOf';
import { getInjections } from '../decorators/Inject';
import { getParent } from '../decorators/Parent';
import { getSubscriptions } from '../decorators/Subscribe';
import { getVariables } from '../decorators/Variable';
import { EntityError } from '../errors/EntityError';
import { EntityRegistrationError } from '../errors/EntityRegistrationError';
import { InstanceType } from '../types/InstanceType';
import { isClass } from '../util/isClass';

import { EntityEvents } from './EntityEvents';
import { ReferenceManager } from './ReferenceManager';
import { ComponentAPI } from './api/ComponentAPI';
import { EntityAPI } from './api/EntityAPI';
import { PluginAPI } from './api/PluginAPI';
import { Component } from './interfaces/Component';
import { Entity, EntityType } from './interfaces/Entity';
import { Plugin } from './interfaces/Plugin';
import { ComponentReference } from './types/ComponentReference';
import { EntityReference } from './types/EntityReference';
import { PluginReference } from './types/PluginReference';

export enum PluginHook {
	PRE_COMPONENT_LOAD = 'onPreComponentLoad',
	PRE_COMPONENT_UNLOAD = 'onPreComponentUnload',
	POST_COMPONENT_LOAD = 'onPostComponentLoad',
	POST_COMPONENT_UNLOAD = 'onPostComponentUnload',
}

export interface PendingEntityInfo {
	name: string;
	entity: Entity;
	missing: Array<EntityReference>;
}

export class EntityManager {
	private readonly bento: Bento;

	private readonly events: Map<string, EntityEvents> = new Map();

	private readonly entities: Map<string, Entity> = new Map();
	private readonly pending: Map<string, Entity> = new Map();

	private readonly references: ReferenceManager<Entity | InstanceType<Entity>> = new ReferenceManager();

	public constructor(bento: Bento) {
		this.bento = bento;
	}

	public resolveReference(reference: EntityReference, error?: boolean): ReturnType<ReferenceManager<Entity>['resolve']> {
		return this.references.resolve(reference, error);
	}

	/**
	 * Check if EntityEvents exists
	 * @param reference EntityReference
	 *
	 * @returns boolean
	 */
	public hasEvents(reference: EntityReference): boolean {
		const name = this.references.resolve(reference);

		return this.events.has(name);
	}

	/**
	 * Get EntityEvents or create it
	 * @param reference EntityReference
	 *
	 * @returns EntityEvents
	 */
	public getEvents(reference: EntityReference): EntityEvents {
		const name = this.references.resolve(reference, true);
		if (!this.hasEvents(name)) {
			const events = new EntityEvents(name, this.bento.options);
			this.events.set(name, events);

			return events;
		}

		return this.events.get(name);
	}

	/**
	 * Get loaded entities
	 * @param type EntityType
	 *
	 * @returns Entity Map
	 */
	public getEntities<T extends Entity>(type?: EntityType): Map<string, T> {
		const entities = Array.from(this.entities.entries())
			.filter(([, entity]) => !type || entity.type === type);

		return new Map(entities) as Map<string, T>;
	}

	/**
	 * Check if Entity exists
	 * @param reference EntityReference
	 *
	 * @returns boolean
	 */
	public hasEntity(reference: EntityReference): boolean {
		const name = this.references.resolve(reference);

		return this.getEntities().has(name);
	}

	/**
	 * Get Entity
	 * @param reference EntityReference
	 *
	 * @returns Entity or null
	 */
	public getEntity<T extends Entity>(reference: EntityReference<T>): T {
		const name = this.references.resolve(reference);

		return (this.getEntities().get(name) || null) as T;
	}

	/**
	 * Add a Entity to Bento
	 * @param entity - Entity
	 *
	 * @returns Entity name
	 */
	public async addEntity(entity: Entity | InstanceType<Entity>): Promise<string> {
		if (typeof entity === 'function' && isClass(entity)) entity = new (entity as new () => Entity)();

		if (entity == null || typeof entity !== 'object') throw new IllegalArgumentError('Entity must be a object');

		if (typeof entity.name !== 'string') throw new IllegalArgumentError('Entity name must be a string');
		if (!entity.name) throw new EntityRegistrationError(entity, 'Entity must specify a name');

		if (typeof entity.type !== 'string') throw new IllegalArgumentError('Entity type must be a string');
		if (!entity.type) throw new EntityRegistrationError(entity, 'Entity type must be specificed');

		if (this.hasEntity(entity.name)) {
			const oldEntity = this.getEntity(entity.name);
			if (!oldEntity.replaceable) throw new IllegalArgumentError(`Entity name "${entity.name}" is already in use, and is not replaceable`);

			return this.replaceEntity(oldEntity, entity);
		}

		this.prepareEntity(entity);

		return this.loadEntity(entity);
	}

	/**
	 * Replace entity and rewrite references and name behind the scenes.
	 *
	 * This allows for the following code to work:
	 * ```ts
	 * class Old { name = 'old'; replaceable = true }
	 * class New { name = 'new' }
	 *
	 * await bento.replaceEntity(Old, new New());
	 *
	 * bento.getEntity(Old); // Would actually return Instance of the New class
	 * ```
	 *
	 * @param reference EntityReference
	 * @param entity Entity
	 */
	public async replaceEntity(reference: EntityReference, entity: Entity | InstanceType<Entity>): Promise<string> {
		const oldEntity = this.getEntity(reference);
		if (!oldEntity) throw new IllegalArgumentError('Entity to replace does not exist');

		// Handle uninstantiated Entity
		if (typeof entity === 'function' && isClass(entity)) entity = new (entity as new () => Entity)();

		if (entity == null || typeof entity !== 'object') throw new IllegalArgumentError('Entity must be a object');

		if (typeof entity.name !== 'string') throw new IllegalArgumentError('Entity name must be a string');
		if (!entity.name) throw new EntityRegistrationError(entity, 'Entity must specify a name');

		if (typeof entity.type !== 'string') throw new IllegalArgumentError('Entity type must be a string');
		if (!entity.type) throw new EntityRegistrationError(entity, 'Entity type must be specificed');

		if (!oldEntity.replaceable) throw new IllegalArgumentError(`Entity name "${entity.name}" is not marked as replaceable`);

		this.prepareEntity(entity);

		// Remove old Entity from Bento
		let removed = await this.removeEntity(oldEntity.name);
		removed = removed.filter(e => e.name !== oldEntity.name);

		// Continue to track constructor
		// Allowing Bento to still resolve the name of old entities
		this.references.add(oldEntity, entity.name);

		// Rewrite if needed, for string users
		if (oldEntity.name !== entity.name) {
			this.references.addRewrite(oldEntity, entity.name);
		}

		// Load the new Entity
		const name = await this.loadEntity(entity);

		// Restore Dependents
		for (const item of removed) await this.addEntity(item);

		return name;
	}

	/**
	 * Remove a Entity from Bento
	 * @param reference - Name of Entity
	 */
	public async removeEntity(reference: EntityReference): Promise<Array<Entity>> {
		const name = this.references.resolve(reference);
		const entity = this.getEntity(name);
		if (!entity) throw new IllegalStateError(`Entity "${name}" is not currently loaded.`);

		let removed: Array<Entity> = [];
		// if we have any dependents lets unload them first
		const dependents = this.getEntityDependents(entity);
		for (const dependent of dependents) {
			// skip already removed entities
			if (removed.find(d => d.name === dependent.name) != null) continue;

			const also = await this.removeEntity(dependent.name);
			removed = [...removed, ...also];
		}

		// onPreComponentUnload
		if (entity.type === EntityType.COMPONENT) {
			await this.handlePluginHook(PluginHook.PRE_COMPONENT_UNLOAD, entity as Component);
		}

		// call onUnload
		if (typeof entity.onUnload === 'function') {
			try {
				await entity.onUnload();
			} catch {
				// Ignore
			}
		}

		removed.push(entity);

		// if we were a child, inform parent of our unloading
		if (entity.parent) {
			entity.parent = this.references.resolve(entity.parent);

			if (this.hasEntity(entity.parent)) {
				const parent = this.getEntity(entity.parent);

				if (typeof parent.onChildUnload === 'function') {
					try {
						await parent.onChildUnload(entity);
					} catch (e) {
						// Ignore
					}
				}
			}
		}

		// remove all event subscriptions
		entity.api.unsubscribeAll();

		// remove reference
		this.references.remove(entity);

		// delete entity
		if (this.hasEntity(entity.name)) {
			this.entities.delete(entity.name);
		}

		// onPostComponentUnload
		if (entity.type === EntityType.COMPONENT) {
			await this.handlePluginHook(PluginHook.POST_COMPONENT_UNLOAD, entity as Component);
		}

		return removed;
	}

	/**
	 * Check if Plugin exists
	 * @param reference PluginReference
	 *
	 * @returns boolean
	 */
	public hasPlugin(reference: PluginReference): boolean {
		const name = this.references.resolve(reference);

		return this.getEntities<Plugin>(EntityType.PLUGIN).has(name);
	}

	/**
	 * Get all Plugins
	 *
	 * @returns Plugin Map
	 */
	public getPlugins(): Map<string, Plugin> {
		return this.getEntities<Plugin>(EntityType.PLUGIN);
	}

	/**
	 * Get Plugin
	 * @param reference PluginReference
	 *
	 * @returns Plugin or null
	 */
	public getPlugin<T extends Plugin>(reference: PluginReference<T>): T {
		const name = this.references.resolve(reference);

		return (this.getEntities<Plugin>(EntityType.PLUGIN).get(name) || null) as T;
	}

	/**
	 * Adds plugins in order of array
	 * @param plugins - array of plugins
	 *
	 * @returns Array of loaded plugin names
	 */
	public async addPlugins(plugins: Array<Plugin | InstanceType<Plugin>>): Promise<Array<string>> {
		if (!Array.isArray(plugins)) throw new IllegalArgumentError('addPlugins only accepts an array.');

		const results = [];
		for (const plugin of plugins) {
			const name = await this.addPlugin(plugin);
			results.push(name);
		}

		return results;
	}

	public async addPlugin(plugin: Plugin | InstanceType<Plugin>): Promise<string> {
		if (typeof plugin === 'function' && isClass(plugin)) plugin = new (plugin as new () => Plugin)();

		Object.defineProperty(plugin, 'type', {
			configurable: true,
			writable: false,
			enumerable: true,
			value: EntityType.PLUGIN,
		});

		return this.addEntity(plugin);
	}

	public async replacePlugin(reference: PluginReference, plugin: Plugin | InstanceType<Plugin>): Promise<string> {
		if (typeof plugin === 'function' && isClass(plugin)) plugin = new (plugin as new () => Plugin)();

		Object.defineProperty(plugin, 'type', {
			configurable: true,
			writable: false,
			enumerable: true,
			value: EntityType.PLUGIN,
		});

		return this.replaceEntity(reference, plugin);
	}

	public async removePlugin(plugin: PluginReference): Promise<Array<Entity>> {
		return this.removeEntity(plugin);
	}

	/**
	 * Check if Component exists
	 * @param reference ComponentReference
	 *
	 * @returns boolean
	 */
	public hasComponent(reference: ComponentReference): boolean {
		const name = this.references.resolve(reference);

		return this.getEntities<Component>(EntityType.COMPONENT).has(name);
	}

	/**
	 * Get all Components
	 *
	 * @returns Component Map
	 */
	public getComponents(): Map<string, Component> {
		return this.getEntities<Component>(EntityType.COMPONENT);
	}

	/**
	 * Adds components in order of array
	 * @param components - array of plugins
	 *
	 * @returns Array of loaded plugin names
	 */
	public async addComponents(components: Array<Component | InstanceType<Component>>): Promise<Array<string>> {
		if (!Array.isArray(components)) throw new IllegalArgumentError('addComponents only accepts an array');

		const results = [];
		for (const component of components) {
			const name = await this.addComponent(component);
			results.push(name);
		}

		return results;
	}

	/**
	 * Get Component
	 * @param reference ComponentReference
	 *
	 * @returns Component or null
	 */
	public getComponent<T extends Component>(reference: ComponentReference<T>): T {
		const name = this.references.resolve(reference);

		return (this.getEntities<Component>(EntityType.COMPONENT).get(name) || null) as T;
	}

	/**
	 * Add Component
	 * @param component Component
	 *
	 * @returns Component Name
	 */
	public async addComponent(component: Component | InstanceType<Component>): Promise<string> {
		if (typeof component === 'function' && isClass(component)) component = new (component as new () => Component)();

		Object.defineProperty(component, 'type', {
			configurable: true,
			writable: false,
			enumerable: true,
			value: EntityType.COMPONENT,
		});

		return this.addEntity(component);
	}

	/**
	 * Replace Component
	 * @param reference ComponentReference
	 * @param component Component
	 *
	 * @returns Component Name
	 */
	public async replaceComponent(reference: ComponentReference, component: Component | InstanceType<Component>): Promise<string> {
		if (typeof component === 'function' && isClass(component)) component = new (component as new () => Component)();

		Object.defineProperty(component, 'type', {
			configurable: true,
			writable: false,
			enumerable: true,
			value: EntityType.COMPONENT,
		});

		return this.replaceEntity(reference, component);
	}

	/**
	 * Remove Component
	 * @param reference ComponentReference
	 *
	 * @returns Removed Entities
	 */
	public async removeComponent(reference: ComponentReference): Promise<Array<Entity>> {
		return this.removeEntity(reference);
	}

	/**
	 * Verify loaded entites & call their onVerify() hook
	 * @returns Map of string/Entity pairs
	 */
	public async verify(): Promise<Map<string, Entity>> {
		const pending = this.getPendingEntities();
		if (pending.length > 0) {
			throw new IllegalStateError(`One or more entities are still in a pending state: '${pending.map(p => p.name).join('\', \'')}'`);
		}

		const entities = this.getEntities();
		for (const [name, entity] of entities.entries()) {
			if (typeof entity.onVerify !== 'function') continue;

			try {
				await entity.onVerify();
			} catch (e) {
				throw new EntityError(`Entity "${name}".onVerify() threw error`).setCause(e as Error);
			}
		}

		return entities;
	}

	/**
	 * @see PendingEntityInfo
	 * @returns - All currently pending bento entities and their info
	 */
	public getPendingEntities(): Array<PendingEntityInfo> {
		const pending: Array<PendingEntityInfo> = [];

		for (const [name, entity] of this.pending.entries()) {
			// get pending items
			const missing = this.getMissingDependencies(entity);

			pending.push({
				name,
				entity,
				missing,
			});
		}

		return pending;
	}

	/**
	 * Get all dependents of a entity
	 * @param entity - EntityReference
	 *
	 * @returns Array of Entities
	 */
	public getEntityDependents<T extends Entity>(entity: EntityReference): Array<T> {
		const name = this.references.resolve(entity);
		if (!this.hasEntity(name)) throw new IllegalStateError(`Entity "${name}" does not exist`);

		const dependents: Array<T> = [];
		for (const item of this.getEntities().values()) {
			for (const dependency of item.dependencies) {
				if (name === this.references.resolve(dependency)) {
					dependents.push(item as T);
				} else if (item.parent && name === this.references.resolve(item.parent)) {
					dependents.push(item as T);
				}
			}
		}

		return dependents;
	}

	/**
	 * Get missing depenencies of an Entity
	 * @param reference EntityReference
	 *
	 * @returns EntityReference Array
	 */
	public getMissingDependencies(entityOrReference: Entity | EntityReference): Array<EntityReference> {
		let entity: Entity;
		if (this.hasEntity(entityOrReference)) entity = this.getEntity(entityOrReference);
		else entity = entityOrReference as Entity;

		// by this point we should have a entity instance, verify
		if (entity == null || typeof entity !== 'object') throw new IllegalArgumentError('Entity must be an object');
		if (entity.dependencies == null || !Array.isArray(entity.dependencies)) {
			throw new IllegalArgumentError('Entity dependencies must be an array');
		}

		const dependencies = [];
		for (const dependency of entity.dependencies) {
			const name = this.references.resolve(dependency);
			// name failed to resolve or entity is not loaded
			if (!name || !this.hasEntity(name)) dependencies.push(dependency);
		}

		return dependencies;
	}

	/**
	 * Ensures all entity dependencies resolve to a name, and no duplicates
	 * @param entity Entity
	 */
	private resolveDependencies(entity: Entity) {
		const dependencies: Array<EntityReference> = [];

		for (const dependency of entity.dependencies) {
			const name = this.references.resolve(dependency);
			if (!name) {
				dependencies.push(dependency);
				continue;
			}

			if (name === entity.name) continue;
			else if (!dependencies.includes(name)) dependencies.push(name);
		}

		entity.dependencies = dependencies;
	}

	/**
	 * Handle pending entities
	 *
	 * @returns Promise
	 */
	private async handlePendingEntities(): Promise<void> {
		let loaded = 0;
		for (const entity of this.pending.values()) {
			// convert depdendencies again, for any that were not loaded previously
			this.resolveDependencies(entity);

			const missing = this.getMissingDependencies(entity);
			if (missing.length > 0) continue;

			this.pending.delete(entity.name);
			try {
				await this.handleLifecycle(entity);
				loaded++;
			} catch (e) {
				this.pending.set(entity.name, entity);
				throw e;
			}
		}

		if (loaded > 0) return this.handlePendingEntities();
	}

	/**
	 * Prepare Decorators
	 * @param entity Entity
	 */
	private prepareDecorators(entity: Entity) {
		// @Inject
		getInjections(entity.constructor).forEach(i => entity.dependencies.push(i.reference));

		// @Subscribe
		getSubscriptions(entity.constructor).forEach(s => entity.dependencies.push(s.reference));

		// @ChildOf
		const childOf = getChildOf(entity.constructor);
		if (childOf !== null) entity.parent = childOf;

		// @Parent
		const parent = getParent(entity.constructor);
		if (parent !== null) entity.parent = parent.reference;
	}

	/**
	 * Handle Decorators
	 * @param entity Entity
	 */
	private handleDecorators(entity: Entity) {
		// @Inject Decorator
		getInjections(entity.constructor).forEach(i => entity.api.injectEntity(i.reference, i.key));

		// @Subscribe Decorator
		getSubscriptions(entity.constructor).forEach(s => entity.api.subscribe(s.reference, s.event, s.handler, entity));

		// @Variable Decorator
		getVariables(entity.constructor).forEach(v => entity.api.injectVariable(v.definition, v.key));

		// @Parent Decorator
		const parent = getParent(entity.constructor);
		if (parent !== null) entity.api.injectEntity(parent.reference, parent.propertyKey);
	}

	/**
	 * Enforces Bento API and prepares entity for loading
	 * @param entity - Entity
	 */
	private prepareEntity(entity: Entity): void {
		// take control and redefine entity name
		Object.defineProperty(entity, 'name', {
			configurable: true,
			writable: false,
			enumerable: true,
			value: entity.name,
		});

		// Check dependencies
		if (entity.dependencies == null) entity.dependencies = [];
		if (entity.dependencies != null && !Array.isArray(entity.dependencies)) {
			throw new EntityRegistrationError(entity, `${entity.name}.dependencies must be an array`);
		}

		if (entity.constructor) {
			// if entity has constructor track it
			this.references.add(entity);

			// prepare decorators
			this.prepareDecorators(entity);
		}

		// Append parent to dependencies
		if (entity.parent) entity.dependencies.push(entity.parent);

		// convert dependencies
		this.resolveDependencies(entity);
	}

	/**
	 * Load Entity into Bento or deffer for dependencies
	 * @param entity Entity
	 *
	 * @returns Entity Name
	 */
	private async loadEntity(entity: Entity): Promise<string> {
		// Create API instance
		let api: EntityAPI;
		if (entity.type === EntityType.PLUGIN) api = new PluginAPI(this.bento, entity as Plugin);
		else if (entity.type === EntityType.COMPONENT) api = new ComponentAPI(this.bento, entity as Component);

		Object.defineProperty(entity, 'api', {
			configurable: true,
			writable: false,
			enumerable: true,
			value: api,
		});

		// determine dependencies
		const missing = this.getMissingDependencies(entity);
		if (missing.length === 0) {
			// All dependencies are already loaded, handle lifecycle events
			await this.handleLifecycle(entity);

			// if any pending entities, attempt to handle them now
			if (this.pending.size > 0) await this.handlePendingEntities();
		} else {
			// not able to handle lifecycle yet :c
			this.pending.set(entity.name, entity);
		}

		return entity.name;
	}

	/**
	 * Handle Entity Lifecycle
	 * @param entity Entity
	 */
	private async handleLifecycle(entity: Entity) {
		// handle parent
		let parent = null;
		if (entity.parent) {
			entity.parent = this.references.resolve(entity.parent);
			if (!this.hasEntity(entity.parent)) throw new IllegalStateError(`Child entity "${entity.name}" loaded prior to Parent entity "${entity.parent}"`); // aka, universe bork

			parent = this.getEntity(entity.parent);
		}

		// No class? No Decorators! hmpf!
		if (entity.constructor) this.handleDecorators(entity);

		// if we are a plugin verify we are not depending on a component
		if (entity.type === EntityType.PLUGIN) {
			for (const reference of entity.dependencies) {
				const dependency = this.getEntity(reference);

				if (dependency.type === EntityType.COMPONENT) throw new EntityRegistrationError(entity, `Cannot depend on Component "${dependency.name}"`);
			}
		}

		// onPreComponentLoad
		if (entity.type === EntityType.COMPONENT) {
			await this.handlePluginHook(PluginHook.PRE_COMPONENT_LOAD, entity as Component);
		}

		// dont move this: plugins must be defined before calling onload.
		// this is because plugins can add components and other objects
		// that will then need the plugin itself to continue loading
		this.entities.set(entity.name, entity);

		// Call onLoad if present
		if (typeof entity.onLoad === 'function') {
			try {
				await entity.onLoad(entity.api);
			} catch (e) {
				throw new EntityRegistrationError(entity, `${entity.name}.onLoad() threw error`).setCause(e as Error);
			}
		}

		// if we just loaded a child entity, lets inform the parent
		if (parent != null && typeof parent.onChildLoad === 'function') {
			try {
				await parent.onChildLoad(entity);
			} catch (e) {
				throw new EntityRegistrationError(parent, `Failed to load child entity "${entity.name}"`).setCause(e as Error);
			}
		}

		// onPostComponentLoad
		if (entity.type === EntityType.COMPONENT) {
			await this.handlePluginHook(PluginHook.POST_COMPONENT_LOAD, entity as Component);
		}
	}

	/**
	 * Call Hook for all plugins
	 * @param hookName Hook name
	 * @param component Component
	 */
	private async handlePluginHook(hookName: PluginHook, component: Component) {
		for (const plugin of this.getEntities<Plugin>(EntityType.PLUGIN).values()) {
			if (typeof plugin[hookName] !== 'function') continue;

			try {
				await plugin[hookName](component);
			} catch (e) {
				throw new ProcessingError(`Plugin "${plugin.name}" ${hookName} hook threw an error`).setCause(e as Error);
			}
		}
	}
}
