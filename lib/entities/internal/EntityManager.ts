
import { IllegalArgumentError, IllegalStateError, ProcessingError } from '@ayanaware/errors';

import { Bento } from '../../Bento';
import {
	getChildOfDecoratorInjection,
	getInjectDecoratorInjections,
	getParentDecoratorInjection,
	getSubscribeDecoratorInjections,
	getVariableDecoratorInjections,
} from '../../decorators/internal';
import { EntityRegistrationError } from '../../errors';
import { ComponentAPI, PluginAPI } from '../api';
import { Component, Entity, Plugin } from '../interfaces';
import { ComponentReference, EntityReference, PluginReference, ReferenceManager } from '../references';

import { EntityEvents } from './EntityEvents';

export enum EntityType {
	PLUGIN = 'plugin',
	COMPONENT = 'component',
}

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
	 *
	 * @param reference Entity instance, name or reference
	 *
	 * @see ReferenceManager#resolveName
	 * @returns resolved entity name
	 */
	public resolveName(reference: EntityReference): string {
		return this.references.resolveName(reference);
	}

	/**
	 * Get instances of all currently loaded entities
	 * @param type - EntityType
	 *
	 * @returns Array of entity instances
	 */
	public getEntities<T extends Entity>(type?: EntityType): Map<string, T> {
		const entities = Array.from(this.entities.entries())
		.filter(([name, entity]) => type && entity.type === type);

		return new Map(entities) as Map<string, T>;
	}

	/**
	 * Check if a given entity exists
	 *
	 * @param reference Entity instance, name or reference
	 *
	 * @returns boolean
	 */
	public hasEntity(reference: EntityReference): boolean {
		const name = this.resolveName(reference);

		return this.getEntities().has(name);
	}

	/**
	 * Get entity instance
	 * @param reference - Entity name or reference
	 *
	 * @returns Entity instance
	 */
	public getEntity<T extends Entity>(reference: EntityReference): T {
		const name = this.resolveName(reference);

		return (this.getEntities().get(name) || null) as T;
	}

	public hasPlugin(reference: PluginReference): boolean {
		const name = this.resolveName(reference);

		return this.getEntities<Plugin>(EntityType.PLUGIN).has(name);
	}

	public getPlugin<T extends Plugin>(reference: PluginReference): T {
		const name = this.resolveName(reference);

		return (this.getEntities<Plugin>(EntityType.PLUGIN).get(name) || null) as T;
	}

	public getPlugins(): Map<string, Plugin> {
		return this.getEntities<Plugin>(EntityType.PLUGIN);
	}

	public hasComponent(reference: ComponentReference): boolean {
		const name = this.resolveName(reference);

		return this.getEntities<Component>(EntityType.COMPONENT).has(name);
	}

	public getComponent<T extends Component>(reference: ComponentReference): T {
		const name = this.resolveName(reference);

		return (this.getEntities<Component>(EntityType.COMPONENT).get(name) || null) as T;
	}

	public getComponents(): Map<string, Component> {
		return this.getEntities<Component>(EntityType.COMPONENT);
	}

	/**
	 * Check if a given entity events exists
	 * @param reference - Entity name or reference
	 *
	 * @returns boolean
	 */
	public hasEvents(reference: EntityReference) {
		const name = this.resolveName(reference);

		return this.events.has(name);
	}

	/**
	 * Get entity events instance or create it
	 * @param reference - Entity name or reference
	 *
	 * @returns Entity events instance
	 */
	public getEvents(reference: EntityReference) {
		const name = this.resolveName(reference);
		if (!this.hasEvents(name)) {
			const events = new EntityEvents(name, this.bento.options);
			this.events.set(name, events);

			return events;
		}

		return this.events.get(name);
	}

	/**
	 * Fetches all child entities of a given parent entity
	 * @param parent - Parent entity name or reference
	 *
	 * @returns Array of child entities
	 */
	public getEntityChildren<T extends Entity>(parent: EntityReference): Array<T> {
		const name = this.resolveName(parent);
		if (!this.entities.has(name)) throw new IllegalStateError(`Parent "${name}" is not loaded`);

		const children: Array<T> = [];
		for (const entity of this.entities.values()) {
			if (entity.parent != null && name === this.resolveName(entity.parent)) {
				children.push(entity as T);
			}
		}

		return children;
	}

	/**
	 * Returns an array of dependencies requested but not loaded yet.
	 *
	 * @param entity EntityReference
	 *
	 * @returns An array of dependencies requested but not loaded
	 */
	public getMissingDependencies(entity: EntityReference): Array<string> {
		try {
			const name = this.resolveName(entity);
			if (this.entities.has(name)) entity = this.getEntity(name);
		} catch (e) {
			// 00f
		}

		if (entity == null || typeof entity !== 'object') throw new IllegalArgumentError(`Entity must be an object`);
		if (entity.dependencies == null || !Array.isArray(entity.dependencies)) throw new IllegalArgumentError(`Entity dependencies must be an array`);

		return entity.dependencies.reduce((a: Array<string>, d: any) => {
			try {
				const name = this.resolveName(d);
				if (!this.entities.has(name)) a.push(name);
			} catch (e) {
				a.push(d);
			}

			return a;
		}, []);
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
	 * Handle pending entities
	 */
	private async handlePendingEntities(): Promise<void> {
		let loaded = 0;

		for (const entity of this.pending.values()) {
			const missing = this.getMissingDependencies(entity);
			if (missing.length === 0) {
				this.pending.delete(entity.name);

				await this.loadEntity(entity);
				loaded++;
			}
		}

		if (loaded > 0) await this.handlePendingEntities();
	}

	/**
	 * Attach Decorator data to Entity
	 *
	 * @param entity Entity
	 */
	private prepareDecorators(entity: Entity) {
		// @ChildOf
		if (getChildOfDecoratorInjection(entity) != null) {
			if (entity.parent != null) throw new EntityRegistrationError(entity, 'Parent already defined. Can\'t prepare @ChildOf decorator');

			entity.parent = getChildOfDecoratorInjection(entity).reference;
		}

		// @Inject Decorator
		getInjectDecoratorInjections(entity).forEach(i => entity.dependencies.push(i.reference));

		// @Subscribe Decorator
		getSubscribeDecoratorInjections(entity).forEach(s => entity.dependencies.push(s.reference));
	}

	/**
	 * Handle Decorator Injections
	 *
	 * @param entity Entity
	 */
	private handleDecorators(entity: Entity) {
		// @Inject Decorator
		for (const injection of getInjectDecoratorInjections(entity)) {
			entity.api.injectEntity(injection.reference, injection.propertyKey);
		}

		// @Parent Decorator
		if (entity.parent && getParentDecoratorInjection(entity) != null) {
			Object.defineProperty(entity, getParentDecoratorInjection(entity).propertyKey, {
				configurable: true,
				writable: false,
				enumerable: true,
				value: entity.parent,
			});
		}

		// @Subscribe Decorator
		for (const injection of getSubscribeDecoratorInjections(entity)) {
			entity.api.subscribe(injection.reference, injection.eventName, injection.handler, entity);
		}

		// @Variable Decorator
		for (const injection of getVariableDecoratorInjections(entity)) {
			entity.api.injectVariable(injection.definition, injection.propertyKey);
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

		if (this.entities.has(entity.name)) throw new EntityRegistrationError(entity, `Entity name "${entity.name}" must be unique`);

		// Check dependencies
		if (entity.dependencies == null) entity.dependencies = [];
		if (entity.dependencies != null && !Array.isArray(entity.dependencies)) {
			throw new EntityRegistrationError(entity, `"${entity.name}" Entity dependencies is not an array`);
		}

		// prepare entity
		this.prepareEntity(entity);

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

	/**
	 * Remove a Entity from Bento
	 * @param reference - Name of Entity
	 */
	public async removeEntity(reference: EntityReference) {
		const name = this.resolveName(reference);
		if (typeof name !== 'string') throw new IllegalArgumentError('Name must be a string');
		if (!name) throw new IllegalArgumentError('Name must not be empty');

		const entity = this.entities.get(name);
		if (!entity) throw new Error(`Entity '${name}' is not currently loaded.`);

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

			if (this.entities.has(entity.parent)) {
				const parent = this.entities.get(entity.parent);

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
		if (this.entities.has(entity.name)) {
			this.entities.delete(entity.name);
		}

		// onPostComponentUnload
		if (entity.type === EntityType.COMPONENT) {
			await this.handlePluginHook(PluginHook.onPostComponentUnload, entity as Component);
		}
	}

	/**
	 * Enforces Bento API and prepares entity to be loaded
	 * @param entity - Entity to be prepared
	 */
	private prepareEntity(entity: Entity) {
		// take control and redefine entity name
		Object.defineProperty(entity, 'name', {
			configurable: true,
			writable: false,
			enumerable: true,
			value: entity.name,
		});

		// if entity has constructor lets track it
		this.references.addReference(entity);

		this.prepareDecorators(entity);

		// Append parent to dependencies
		if (entity.parent) entity.dependencies.push(entity.parent);

		// remove any duplicates or self from dependencies
		entity.dependencies = entity.dependencies.reduce((a, d) => {
			// prevent any dependencies to self
			if (this.references.resolveNameSafe(d) === entity.name) return a;

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
	}

	private async loadEntity(entity: Entity) {
		let parent = null;
		if (entity.parent) {
			entity.parent = this.resolveName(entity.parent);
			if (!this.entities.has(entity.parent)) throw new IllegalStateError(`Somehow a child entity loaded before their parent!`); // aka, universe bork

			parent = this.entities.get(entity.parent);
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
				throw new EntityRegistrationError(entity, `Entity "${entity.name}" failed to load`).setCause(e);
			}
		}

		// if we just loaded a child entity, lets inform the parent
		if (parent != null && parent.onChildLoad) {
			try {
				await parent.onChildLoad(entity);
			} catch (e) {
				throw new EntityRegistrationError(entity, `Parent "${entity.parent}" failed to load child`).setCause(e);
			}
		}

		// onPostComponentLoad
		if (entity.type === EntityType.COMPONENT) {
			await this.handlePluginHook(PluginHook.onPostComponentLoad, entity as Component);
		}
	}
}
