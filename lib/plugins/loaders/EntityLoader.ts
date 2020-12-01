import { IllegalArgumentError, ProcessingError } from '@ayanaware/errors';

import { Entity, EntityType, Plugin, PluginAPI } from '../../entities';

export class EntityLoader implements Plugin {
	public name = 'EntityLoader';
	public api!: PluginAPI;

	/**
	 * Entities we manage
	 */
	protected entities: Set<string> = new Set();

	private readonly pending: Set<Entity> = new Set();

	public async onLoad() {
		return this.handlePending();
	}

	public async onUnload() {
		// unload entities we manage
		for (const name of this.entities) await this.api.bento.removeEntity(name);
	}

	protected async handlePending() {
		if (this.pending.size < 1) return;

		for (const entity of this.pending) {
			const name = await this.api.bento.addEntity(entity);
			this.entities.add(name);

			this.pending.delete(entity);
		}
	}

	/**
	 * Detects if a value is Entitylike
	 * Entitylike values are not null objects or functions
	 *
	 * @param v Value
	 * @returns boolean
	 */
	protected isEntitylike(v: any) {
		return v != null && (typeof v === 'function' || typeof v === 'object');
	}

	/**
	 * Detects if a value is Classlike.
	 * Classlike values are functions that have a prototype object
	 *
	 * @param v Value
	 * @returns boolean
	 */
	protected isClasslike(v: any) {
		return typeof v === 'function' && typeof v.prototype === 'object';
	}

	/**
	 * Detects if a value is Functionlike
	 * Functionlike values are functions that have no prototype object
	 *
	 * @param v Value
	 * @returns boolean
	 */
	protected isFunctionlike(v: any) {
		return typeof v === 'function' && typeof v.prototype === 'undefined';
	}

	/**
	 * Tries to find Entity and then instantiate it. An Entity can be a class or an object.
	 *
	 * @param entity Uninstantiated Entity
	 *
	 * @throws ProcessingError If no Entity found or fails to instantiate
	 * @returns EntityInstance
	 */
	protected instantiate<T extends Entity = Entity>(entity: any): T {
		let instance: T = entity;

		// instance Classlike or Functionlike
		try {
			if (this.isClasslike(entity)) instance = new entity();
			else if (this.isFunctionlike(entity)) instance = entity();
		} catch (e) {
			throw new ProcessingError('instantiate(): Failed to instantiate').setCause(e);
		}

		// check for `name`
		if (typeof instance.name !== 'string') throw new ProcessingError(`instantiate(): Instance does not have the name property`);

		return instance;
	}

	/**
	 * Bulk Instantiate Entities and add them to Bento
	 *
	 * @param entities Class or Object Array
	 * @param type EntityType
	 */
	public async addEntities(entities: Array<object | Function>, type: EntityType): Promise<Array<void>> {
		const promises = entities.map(entity => this.addEntity(entity, type));

		return Promise.all(promises);
	}

	/**
	 * Instantiate Entity and add to Bento
	 *
	 * @param entity Class or Object
	 * @param type EntityType
	 */
	public async addEntity(entity: object | Function, type: EntityType): Promise<void> {
		if (!this.isEntitylike(entity)) throw new IllegalArgumentError(`addEntity(): Value not Entitylike`);

		const instance = this.instantiate(entity);
		instance.type = type;

		// API not available. Add to pending
		if (!this.api) {
			this.pending.add(instance);

			return;
		}

		const name = await this.api.bento.addEntity(instance);
		this.entities.add(name);
	}

	/**
	 * Bulk Instantiate Plugins and add them to Bento
	 *
	 * @param plugins Class or Object Array
	 */
	public async addPlugins(plugins: Array<object | Function>): Promise<Array<void>> {
		const promises = plugins.map(plugin => this.addPlugin(plugin));

		return Promise.all(promises);
	}

	/**
	 * Instantiate Plugin and add to Bento
	 * @param plugin Class or Object
	 *
	 * @returns Promise
	 */
	public async addPlugin(plugin: object | Function) {
		return this.addEntity(plugin, EntityType.PLUGIN);
	}

	/**
	 * Bulk Instantiate Components and add them to Bento
	 *
	 * @param components Class or Object Array
	 */
	public async addComponents(components: Array<object | Function>): Promise<Array<void>> {
		const promises = components.map(component => this.addComponent(component));

		return Promise.all(promises);
	}

	/**
	 * Instantiate Component and add to Bento
	 * @param component Class or Object
	 *
	 * @returns Promise
	 */
	public async addComponent(component: any) {
		return this.addEntity(component, EntityType.COMPONENT);
	}
}
