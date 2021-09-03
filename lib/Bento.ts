import { useBento } from './Globals';
import { EntityManager } from './entities/EntityManager';
import { Component } from './entities/interfaces/Component';
import { Entity } from './entities/interfaces/Entity';
import { Plugin } from './entities/interfaces/Plugin';
import { ComponentReference } from './entities/types/ComponentReference';
import { EntityReference } from './entities/types/EntityReference';
import { PluginReference } from './entities/types/PluginReference';
import { BentoState } from './interfaces/BentoState';
import { EventEmitterLike } from './interfaces/EventEmitterLike';
import { PropertyManager } from './properties/PropertyManager';
import { InstanceType } from './types/InstanceType';
import { LiteEmitter } from './util/LiteEmitter';
import { VariableManager } from './variables/VariableManager';

export interface BentoOptions {
	eventEmitter?(): EventEmitterLike;
}

export class Bento {
	public readonly properties = new PropertyManager();
	public readonly variables = new VariableManager();
	public readonly entities = new EntityManager(this);

	public readonly options: BentoOptions;

	public readonly version: string;

	public constructor(options?: BentoOptions) {
		try {
			// ESLint Hates him, check out this one weird trick
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires, import/extensions
			const { version } = require('../package.json');
			this.version = version as string || 'Error';
		} catch {
			this.version = 'Error';
		}

		this.options = {
			...{
				eventEmitter: () => new LiteEmitter(),
			} as BentoOptions, ...options,
		};

		try {
			useBento(this);
		} catch {
			// We ignore this as somebody, somewhere, might want to run multiple Bento instances.
		}
	}

	// ENTITY Aliases

	/**
	 * Alias for Bento.entities.getEntity()
	 * @param reference EntityReference
	 *
	 * @see EntityManager#getEntity
	 * @returns See Bento.entities.getEntity()
	 */
	public getEntity<T extends Entity>(reference: EntityReference<T>): T {
		return this.entities.getEntity<T>(reference);
	}

	/**
	 * Alias for Bento.entities.addEntity()
	 * @param entity Entity
	 *
	 * @see EntityManager#addEntity
	 * @returns See Bento.entities.addEntity()
	 */
	public async addEntity(entity: Entity | InstanceType<Entity>): Promise<string> {
		return this.entities.addEntity(entity);
	}

	/**
	 * Alias for Bento.entities.replaceEntity()
	 * @param reference EntityReference
	 * @param entity Entity
	 *
	 * @see EntityManager#replaceEntity
	 * @returns See Bento.entities.replaceEntity()
	 */
	public async replaceEntity(reference: EntityReference, entity: Entity | InstanceType<Entity>): Promise<string> {
		return this.entities.replaceEntity(reference, entity);
	}

	/**
	 * Alias for Bento.entities.removeEntity()
	 * @param reference EntityReference
	 *
	 * @see EntityManager#removeEntity
	 * @returns See Bento.entities.removeEntity()
	 */
	public async removeEntity(reference: EntityReference): Promise<Array<Entity>> {
		return this.entities.removeEntity(reference);
	}

	// PLUGINS Aliases

	/**
	 * Alias for Bento.entities.getPlugin()
	 * @param reference PluginReference
	 *
	 * @see EntityManager#getPlugin
	 * @returns {Plugin}
	 */
	public getPlugin<T extends Plugin>(reference: PluginReference<T>): T {
		return this.entities.getPlugin<T>(reference);
	}

	/**
	 * Alias for Bento.entities.addPlugins()
	 * @param plugins Array of Plugins
	 *
	 * @see EntityManager#addPlugins
	 * @returns See Bento.entities.addPlugins()
	 */
	public async addPlugins(plugins: Array<Plugin | InstanceType<Plugin>>): Promise<Array<string>> {
		return this.entities.addPlugins(plugins);
	}

	/**
	 * Alias for Bento.entities.addPlugin()
	 * @param plugin Plugin
	 *
	 * @see EntityManager#addPlugin
	 * @returns See Bento.entities.addPlugin()
	 */
	public async addPlugin(plugin: Plugin | InstanceType<Plugin>): Promise<string> {
		return this.entities.addPlugin(plugin);
	}

	/**
	 *
	 * @param reference PluginReference
	 * @param plugin Plugin
	 *
	 * @see EntityManager#replacePlugin
	 * @returns See Bento.entities.replacePlugin()
	 */
	public async replacePlugin(reference: PluginReference, plugin: Plugin | InstanceType<Plugin>): Promise<string> {
		return this.entities.replacePlugin(reference, plugin);
	}

	/**
	 * Alias for Bento.entities.removePlugin()
	 * @param reference PluginReference
	 *
	 * @see EntityManager#removePlugin
	 * @returns See Bento.entities.removePlugin()
	 */
	public async removePlugin(reference: PluginReference): Promise<Array<Entity>> {
		return this.entities.removePlugin(reference);
	}

	// COMPONENTS Aliases

	/**
	 * Alias for Bento.entities.getComponent()
	 * @param reference ComponentReference
	 *
	 * @see EntityManager#getComponent
	 * @returns See Bento.entities.getComponent()
	 */
	public getComponent<T extends Component>(reference: ComponentReference<T>): T {
		return this.entities.getComponent<T>(reference);
	}

	/**
	 * Alias for Bento.entities.addComponent()
	 * @param component Component
	 *
	 * @see EntityManager#addComponent
	 * @returns See Bento.entities.addComponent()
	 */
	public async addComponent(component: Component): Promise<string> {
		return this.entities.addComponent(component);
	}

	/**
	 *
	 * @param reference ComponentReference
	 * @param component Plugin
	 *
	 * @see EntityManager#replaceComponent
	 * @returns See Bento.entities.replaceComponent()
	 */
	public async replaceComponent(reference: ComponentReference, component: Component | InstanceType<Component>): Promise<string> {
		return this.entities.replaceComponent(reference, component);
	}

	/**
	 * Alias for Bento.entities.removeComponent()
	 * @param reference ComponentReference
	 *
	 * @see EntityManager#removeComponent
	 */
	public async removeComponent(reference: ComponentReference): Promise<Array<Entity>> {
		return this.entities.removeComponent(reference);
	}

	// PROPERTIES Aliases

	/**
	 * Alias for Bento.properties.hasProperty()
	 * @param name Property name
	 *
	 * @see PropertyManager#hasProperty
	 * @returns See Bento.properties.hasProperty()
	 */
	public hasProperty(name: string): boolean {
		return this.properties.hasProperty(name);
	}

	/**
	 * Alias for Bento.properties.getProperty()
	 * @param name Property name
	 *
	 * @see PropertyManager#getProperty
	 * @returns See Bento.properties.getProperty()
	 */
	public getProperty<T extends unknown>(name: string): T {
		return this.properties.getProperty<T>(name);
	}

	/**
	 * Alias for Bento.properties.setProperties()
	 * @param properties Object with property key: value pairs
	 *
	 * @see PropertyManager#setProperties
	 * @returns See Bento.properties.setProperties()
	 */
	public setProperties(properties: { [key: string]: any }): void {
		this.properties.setProperties(properties);
	}

	/**
	 * Alias for Bento.properties.setProperty()
	 * @param name Property name
	 * @param value Property value
	 *
	 * @see PropertyManager#setProperty
	 * @returns See Bento.properties.setProperty()
	 */
	public setProperty<T>(name: string, value: T): void {
		this.properties.setProperty<T>(name, value);
	}

	// VARIABLES Aliases

	/**
	 * Alias for Bento.variables.hasVariable()
	 * @param name Variable name
	 *
	 * @see VariableManager#hasVariable
	 * @returns See Bento.variables.hasVariable()
	 */
	public hasVariable(name: string): boolean {
		return this.variables.hasVariable(name);
	}

	/**
	 * Alias for Bento.variables.getVariable()
	 * @param name Variable name
	 *
	 * @see VariableManager#getVariable
	 * @returns See Bento.variables.getVariable()
	 */
	public getVariable<T extends unknown>(name: string): T {
		return this.variables.getVariable<T>(name);
	}

	/**
	 * Alias for Bento.variables.setVariable()
	 * @param name Variable name
	 * @param value Variable value
	 *
	 * @see VariableManager#setVariable
	 * @returns See Bento.variables.setVariable()
	 */
	public setVariable<T>(name: string, value: T): void {
		this.variables.setVariable<T>(name, value);
	}

	/**
	 * Alias for Bento.variables.deleteVariable()
	 * @param name Variable name
	 *
	 * @see VariableManager#deleteVariable
	 * @returns See Bento.variables.deleteVariable()
	 */
	public deleteVariable(name: string): void {
		this.variables.deleteVariable(name);
	}

	/**
	 * Verifies the state of your Application, Will throw an error at anything
	 * "weird" looking. For example if any entities are pending.
	 *
	 * Also indirectly calls .onVerify() lifecycle event. Bento expects this to be called
	 * and may introduce a auto-kill in the future if it is not.
	 *
	 * @returns Application state Object
	 */
	public async verify(): Promise<BentoState> {
		const state: BentoState = { entities: [], variables: [] };

		// verify entities
		const entities = await this.entities.verify();
		for (const entity of entities.values()) {
			state.entities.push({ type: entity.type, name: entity.name });
		}

		// add variable names
		const variables = this.variables.getVariables();
		state.variables = Object.keys(variables);

		// freze object
		Object.freeze(state);

		return state;
	}
}
