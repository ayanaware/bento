import { IllegalArgumentError, IllegalStateError, ProcessingError } from '@ayanaware/errors';

import { Bento } from '../../Bento';
import {
	getChildOfDecoratorInjection,
	getInjections,
	getParentDecoratorInjection,
	getSubscriptions,
	getVariables,
} from '../../decorators/internal';
import { EntityRegistrationError } from '../../errors';
import { Type } from '../../interfaces';
import { ComponentAPI, PluginAPI } from '../api';
import { Component, Entity, EntityType, Plugin } from '../interfaces';
import { ComponentReference, EntityReference, PluginReference, ReferenceManager } from '../references';

import { EntityEvents } from './EntityEvents';

export enum PluginHook {
	onPreComponentLoad = 'onPreComponentLoad',
	onPreComponentUnload = 'onPreComponentUnload',
	onPostComponentLoad = 'onPostComponentLoad',
	onPostComponentUnload = 'onPostComponentUnload',
}

export interface PendingEntityInfo {
	name: string;
	entity: Entity;
	missing: Array<EntityReference>;
}

export class EntityManager {
	private readonly bento: Bento;

	private readonly entities: Map<string, Entity> = new Map();
	private readonly pending: Map<string, Entity> = new Map();

	private readonly events: Map<string, EntityEvents> = new Map();

	private readonly references: ReferenceManager<Entity> = new ReferenceManager();

	public constructor(bento: Bento) {
		this.bento = bento;
	}

	/**
	 * Delegate for the resolveName function
	 * @param reference EntityReference
	 * @param error Throw Error on Failure
	 *
	 * @see ReferenceManager#resolveName
	 * @returns Entity Name or null
	 */
	public resolveName(reference: EntityReference, error: boolean = false): string {
		return this.references.resolveName(reference, error);
	}

	/**
	 * Get loaded entities
	 * @param type EntityType
	 *
	 * @returns Entity Map
	 */
	public getEntities<T extends Entity>(type?: EntityType): Map<string, T> {
		const entities = Array.from(this.entities.entries())
		.filter(([name, entity]) => !type || entity.type === type);

		return new Map(entities) as Map<string, T>;
	}

	/**
	 * Check if Entity exists
	 * @param reference EntityReference
	 *
	 * @returns boolean
	 */
	public hasEntity(reference: EntityReference): boolean {
		const name = this.resolveName(reference);

		return this.getEntities().has(name);
	}

	/**
	 * Get Entity
	 * @param reference EntityReference
	 *
	 * @returns Entity or null
	 */
	public getEntity<T extends Entity>(reference: Type<T> | EntityReference): T {
		const name = this.resolveName(reference);

		return (this.getEntities().get(name) || null) as T;
	}

	/**
	 * Check if Plugin exists
	 * @param reference PluginReference
	 *
	 * @returns boolean
	 */
	public hasPlugin(reference: PluginReference): boolean {
		const name = this.resolveName(reference);

		return this.getEntities<Plugin>(EntityType.PLUGIN).has(name);
	}

	/**
	 * Get Plugin
	 * @param reference PluginReference
	 *
	 * @returns Plugin or null
	 */
	public getPlugin<T extends Plugin>(reference: Type<T> | PluginReference): T {
		const name = this.resolveName(reference);

		return (this.getEntities<Plugin>(EntityType.PLUGIN).get(name) || null) as T;
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
	 * Check if Component exists
	 * @param reference ComponentReference
	 *
	 * @returns boolean
	 */
	public hasComponent(reference: ComponentReference): boolean {
		const name = this.resolveName(reference);

		return this.getEntities<Component>(EntityType.COMPONENT).has(name);
	}

	/**
	 * Get Component
	 * @param reference ComponentReference
	 *
	 * @returns Component or null
	 */
	public getComponent<T extends Component>(reference: Type<T> | ComponentReference): T {
		const name = this.resolveName(reference);

		return (this.getEntities<Component>(EntityType.COMPONENT).get(name) || null) as T;
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
	 * Check if EntityEvents exists
	 * @param reference EntityReference
	 *
	 * @returns boolean
	 */
	public hasEvents(reference: EntityReference) {
		const name = this.resolveName(reference);

		return this.events.has(name);
	}

	/**
	 * Get EntityEvents or create it
	 * @param reference EntityReference
	 *
	 * @returns EntityEvents
	 */
	public getEvents(reference: EntityReference) {
		const name = this.resolveName(reference, true);
		if (!this.hasEvents(name)) {
			const events = new EntityEvents(name, this.bento.options);
			this.events.set(name, events);

			return events;
		}

		return this.events.get(name);
	}

	/**
	 * Get all children of parent Entity
	 * @param parent - EntityReference
	 *
	 * @returns Array of child Entities
	 */
	public getEntityChildren<T extends Entity>(parent: EntityReference): Array<T> {
		const name = this.resolveName(parent);
		if (!this.hasEntity(name)) throw new IllegalStateError(`Parent "${name}" is not loaded`);

		const children: Array<T> = [];
		for (const entity of this.getEntities().values()) {
			if (entity.parent != null && name === this.resolveName(entity.parent)) {
				children.push(entity as T);
			}
		}

		return children;
	}

	/**
	 * Get missing depenencies of an Entity
	 * @param entityOrReference EntityReference
	 *
	 * @returns EntityReference Array
	 */
	public getMissingDependencies(entityOrReference: Entity | EntityReference): Array<string> {
		if (this.hasEntity(entityOrReference)) entityOrReference = this.getEntity(entityOrReference);

		// by this point we should have a entity instance, verify
		if (entityOrReference == null || typeof entityOrReference !== 'object') throw new IllegalArgumentError(`Entity must be an object`);
		if (entityOrReference.dependencies == null || !Array.isArray(entityOrReference.dependencies)) throw new IllegalArgumentError(`Entity dependencies must be an array`);

		return entityOrReference.dependencies.reduce((a: Array<any>, d: any) => {
			const name = this.resolveName(d);

			// name did not resolve
			if (!name) a.push(d);

			// name resolved, entity not loaded
			if (!this.hasEntity(name)) a.push(name);

			// if neither of these above cases are encountered then dependency is resolved
			return a;
		}, []);
	}

	/**
	 * Handle pending entities
	 *
	 * @returns Promise
	 */
	private async handlePendingEntities(): Promise<void> {
		let loaded = 0;
		for (const entity of this.pending.values()) {
			const missing = this.getMissingDependencies(entity);
			if (missing.length > 0) continue;

			this.pending.delete(entity.name);
			try {
				await this.loadEntity(entity);
				loaded++;
			} catch (e) {
				this.pending.set(entity.name, entity);
				throw e;
			}
		}

		if (loaded > 0) return this.handlePendingEntities();
	}

	/**
	 * Attach Decorator data to Entity
	 *
	 * @param entity Entity
	 */
	private prepareDecorators(entity: Entity) {
		// @Inject
		getInjections(entity).forEach(i => entity.dependencies.push(i.reference));

		// @Subscribe
		getSubscriptions(entity).forEach(s => entity.dependencies.push(s.reference));

		// @ChildOf
		if (getChildOfDecoratorInjection(entity) != null) {
			if (entity.parent != null) throw new EntityRegistrationError(entity, 'Parent already defined. Can\'t prepare @ChildOf decorator');

			entity.parent = getChildOfDecoratorInjection(entity).reference;
		}
	}

	/**
	 * Handle Decorator Injections
	 *
	 * @param entity Entity
	 */
	private handleDecorators(entity: Entity) {
		// @Inject Decorator
		getInjections(entity).forEach(i => entity.api.injectEntity(i.reference, i.key));

		// @Subscribe Decorator
		getSubscriptions(entity).forEach(s => entity.api.subscribe(s.reference, s.event, s.handler, entity));

		// @Variable Decorator
		getVariables(entity).forEach(v => entity.api.injectVariable(v.definition, v.key));

		// @Parent Decorator
		if (entity.parent && getParentDecoratorInjection(entity) != null) {
			Object.defineProperty(entity, getParentDecoratorInjection(entity).propertyKey, {
				configurable: true,
				writable: false,
				enumerable: true,
				value: entity.parent,
			});
		}
	}

	/**
	 * Calls a given hook for all plugins
	 * @param hookName Hook name
	 * @param component Component
	 *
	 * @package
	 * @see {@link docs/internal-functions}
	 */
	private async handlePluginHook(hookName: PluginHook | string, component: Component) {
		for (const plugin of this.getEntities<Plugin>(EntityType.PLUGIN).values()) {
			if (!(plugin as Plugin & { [key: string]: any })[hookName]) continue;

			try {
				await (plugin as Plugin & { [key: string]: any })[hookName](component);
			} catch (e) {
				throw new ProcessingError(`Plugin "${plugin.name}" ${hookName} hook threw an error`).setCause(e);
			}
		}
	}

	public async addComponent(component: Component): Promise<string> {
		Object.defineProperty(component, 'type', {
			configurable: true,
			writable: false,
			enumerable: true,
			value: EntityType.COMPONENT,
		});

		return this.addEntity(component);
	}

	public async removeComponent(component: ComponentReference) {
		return this.removeEntity(component);
	}

	/**
	 * Adds plugins in order of array
	 * @param plugins - array of plugins
	 *
	 * @returns Array of loaded plugin names
	 */
	public async addPlugins(plugins: Array<Plugin>) {
		if (!Array.isArray(plugins)) throw new IllegalArgumentError('addPlugins only accepts an array.');

		const results = [];
		for (const plugin of plugins) {
			const name = await this.addPlugin(plugin);
			results.push(name);
		}

		return results;
	}

	public async addPlugin(plugin: Plugin): Promise<string> {
		Object.defineProperty(plugin, 'type', {
			configurable: true,
			writable: false,
			enumerable: true,
			value: EntityType.PLUGIN,
		});

		return this.addEntity(plugin);
	}

	public async removePlugin(plugin: PluginReference) {
		return this.removeEntity(plugin);
	}

	/**
	 * Add a Entity to Bento
	 * @param entity - Entity
	 *
	 * @returns Entity name
	 */
	public async addEntity(entity: Entity): Promise<string> {
		if (entity == null || typeof entity !== 'object') throw new IllegalArgumentError('Entity must be a object');

		if (typeof entity.name !== 'string') throw new IllegalArgumentError('Entity name must be a string');
		if (!entity.name) throw new EntityRegistrationError(entity, 'Entity must specify a name');

		if (typeof entity.type !== 'string') throw new IllegalArgumentError('Entity type must be a string');
		if (!entity.type) throw new EntityRegistrationError(entity, 'Entity type must be specificed');

		if (this.hasEntity(entity.name)) throw new IllegalArgumentError(`Entity name "${entity.name}" is already in use`);

		return this.prepareEntity(entity);
	}

	/**
	 * Remove a Entity from Bento
	 * @param reference - Name of Entity
	 */
	public async removeEntity(reference: EntityReference) {
		const name = this.resolveName(reference);
		const entity = this.getEntity(name);
		if (!entity) throw new IllegalStateError(`Entity "${name}" is not currently loaded.`);

		// if we have any children lets unload them first
		const children = this.getEntityChildren(entity);
		if (children.length > 0) {
			for (const child of children) {
				await this.removeEntity(child.name);
			}
		}

		// onPreComponentUnload
		if (entity.type === EntityType.COMPONENT) {
			await this.handlePluginHook(PluginHook.onPreComponentUnload, entity as Component);
		}

		// call unMount
		if (entity.onUnload) {
			try {
				await entity.onUnload();
			} catch (e) {
				// Ignore
			}
		}

		// if we were a child, inform parent of our unloading
		if (entity.parent) {
			entity.parent = this.resolveName(entity.parent);

			if (this.hasEntity(entity.parent)) {
				const parent = this.getEntity(entity.parent);

				if (parent.onChildUnload) {
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
		this.references.removeReference(entity);

		// delete entity
		if (this.hasEntity(entity.name)) {
			this.entities.delete(entity.name);
		}

		// onPostComponentUnload
		if (entity.type === EntityType.COMPONENT) {
			await this.handlePluginHook(PluginHook.onPostComponentUnload, entity as Component);
		}
	}

	/**
	 * Enforces Bento API and prepares entity for loading
	 * @param entity - Entity
	 *
	 * @returns Entity Name
	 */
	private async prepareEntity(entity: Entity): Promise<string> {
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

		// if entity has constructor track it
		this.references.addReference(entity);

		this.prepareDecorators(entity);

		// Append parent to dependencies
		if (entity.parent) entity.dependencies.push(entity.parent);

		// remove any duplicates or self from dependencies
		entity.dependencies = entity.dependencies.reduce((a, d) => {
			// prevent any dependencies to self
			if (this.resolveName(d) === entity.name) return a;

			// ensure zero duplicates
			if (!Array.prototype.includes.call(a, d)) a.push(d);

			return a;
		}, []);

		// Create and inject api
		const api = entity.type === EntityType.PLUGIN ? new PluginAPI(this.bento, entity as Plugin) : new ComponentAPI(this.bento, entity as Component);
		Object.defineProperty(entity, 'api', {
			configurable: true,
			writable: false,
			enumerable: true,
			value: api,
		});

		// determine dependencies
		const missing = this.getMissingDependencies(entity);
		if (missing.length === 0) {
			// All dependencies are already loaded, go ahead and load the entity
			await this.loadEntity(entity);

			// loaded successfuly, if any pending entities, attempt to handle them now
			if (this.pending.size > 0) await this.handlePendingEntities();
		} else {
			// not able to load this entity yet :c
			this.pending.set(entity.name, entity);
		}

		return entity.name;
	}

	private async loadEntity(entity: Entity) {
		// if we are a plugin verify we are not depending on a component
		if (entity.type === EntityType.PLUGIN) {
			for (const reference of entity.dependencies) {
				const dependency = this.getEntity(reference);

				if (dependency.type === EntityType.COMPONENT) throw new EntityRegistrationError(entity, `Cannot depend on Component "${dependency.name}"`);
			}
		}

		// handle parent
		let parent = null;
		if (entity.parent) {
			entity.parent = this.resolveName(entity.parent);
			if (!this.hasEntity(entity.parent)) throw new IllegalStateError(`Child entity "${entity.name}" loaded prior to Parent entity "${entity.parent}"`); // aka, universe bork

			parent = this.getEntity(entity.parent);
		}

		this.handleDecorators(entity);

		// onPreComponentLoad
		if (entity.type === EntityType.COMPONENT) {
			await this.handlePluginHook(PluginHook.onPreComponentLoad, entity as Component);
		}

		// dont move this: plugins must be defined before calling onload.
		// this is because plugins can add components and other objects
		// that will then need the plugin itself to continue loading
		this.entities.set(entity.name, entity);

		// Call onLoad if present
		if (entity.onLoad) {
			try {
				await entity.onLoad(entity.api);
			} catch (e) {
				throw new EntityRegistrationError(entity, `${entity.name}.onLoad() threw error`).setCause(e);
			}
		}

		// if we just loaded a child entity, lets inform the parent
		if (parent != null && parent.onChildLoad) {
			try {
				await parent.onChildLoad(entity);
			} catch (e) {
				throw new EntityRegistrationError(parent, `Failed to load child entity "${entity.name}"`).setCause(e);
			}
		}

		// onPostComponentLoad
		if (entity.type === EntityType.COMPONENT) {
			await this.handlePluginHook(PluginHook.onPostComponentLoad, entity as Component);
		}
	}
}
