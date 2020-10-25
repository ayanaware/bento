
import * as crypto from 'crypto';

import { IllegalStateError } from '@ayanaware/errors';

import { Component, ComponentReference, Entity, EntityReference, Plugin, PluginReference } from './entities';
import { EntityManager, EntityType } from './entities/internal';
import { BentoState, EventEmitterLike, Type } from './interfaces';
import { PropertyManager } from './properties/internal';
import { LiteEmitter } from './util';
import { VariableManager } from './variables/internal';

export interface BentoOptions {
	createID?(len?: number): string;
	eventEmitter?(): EventEmitterLike;
}

export class Bento {
	public readonly properties: PropertyManager;
	public readonly variables: VariableManager;
	public readonly entities: EntityManager;

	public readonly options: BentoOptions;

	public readonly version: string;

	public constructor(options?: BentoOptions) {
		const { version } = require('../package.json');
		this.version = version;

		this.options = {...{
			createID: (len = 16) => crypto.randomBytes(len).toString('base64').replace(/[^a-z0-9]/gi, '').slice(0, len),
			eventEmitter: () => new LiteEmitter(),
		} as BentoOptions, ...options};

		// now that options has been defined, create our managers
		this.properties = new PropertyManager(this);
		this.variables = new VariableManager(this);
		this.entities = new EntityManager(this);
	}

	// ENTITY Aliases

	/**
	 * Alias for Bento.entities.addEntity()
	 * @param entity Entity
	 *
	 * @see EntityManager#addEntity
	 * @returns See Bento.entities.addEntity()
	 */
	public async addEntity(entity: Entity) {
		return this.entities.addEntity(entity);
	}

	/**
	 * Alias for Bento.entities.getEntity()
	 * @param reference EntityReference
	 *
	 * @see EntityManager#getEntity
	 * @returns See Bento.entities.getEntity()
	 */
	public async getEntity<T extends Entity>(reference: Type<T> | EntityReference) {
		return this.entities.getEntity<T>(reference);
	}

	/**
	 * Alias for Bento.entities.removeEntity()
	 * @param reference EntityReference
	 *
	 * @see EntityManager#removeEntity
	 * @returns See Bento.entities.removeEntity()
	 */
	public async removeEntity(reference: EntityReference) {
		return this.entities.removeEntity(reference);
	}

	// PLUGINS Aliases

	/**
	 * Alias for Bento.entities.addPlugins()
	 * @param plugins Array of Plugins
	 *
	 * @see EntityManager#addPlugins
	 * @returns See Bento.entities.addPlugins()
	 */
	public async addPlugins(plugins: Array<Plugin>) {
		return this.entities.addPlugins(plugins);
	}

	/**
	 * Alias for Bento.entities.addPlugin()
	 * @param plugin Plugin
	 *
	 * @see EntityManager#addPlugin
	 * @returns See Bento.entities.addPlugin()
	 */
	public async addPlugin(plugin: Plugin) {
		return this.entities.addPlugin(plugin);
	}

	/**
	 * Alias for Bento.entities.getPlugin()
	 * @param reference PluginReference
	 *
	 * @see EntityManager#getPlugin
	 * @returns See Bento.entities.getPlugin()
	 */
	public async getPlugin<T extends Plugin>(reference: Type<T> | PluginReference) {
		return this.entities.getPlugin<T>(reference);
	}

	/**
	 * Alias for Bento.entities.removePlugin()
	 * @param reference PluginReference
	 *
	 * @see EntityManager#removePlugin
	 * @returns See Bento.entities.removePlugin()
	 */
	public async removePlugin(reference: PluginReference) {
		return this.entities.removePlugin(reference);
	}

	// COMPONENTS Aliases

	/**
	 * Alias for Bento.entities.addComponent()
	 * @param component Component
	 *
	 * @see EntityManager#addComponent
	 * @returns See Bento.entities.addComponent()
	 */
	public async addComponent(component: Component) {
		return this.entities.addComponent(component);
	}

	/**
	 * Alias for Bento.entities.getComponent()
	 * @param reference ComponentReference
	 *
	 * @see EntityManager#getComponent
	 * @returns See Bento.entities.getComponent()
	 */
	public async getComponent<T extends Component>(reference: Type<T> | ComponentReference) {
		return this.entities.getComponent<T>(reference);
	}

	/**
	 * Alias for Bento.entities.removeComponent()
	 * @param reference ComponentReference
	 *
	 * @see EntityManager#removeComponent
	 * @returns See Bento.entities.removeComponent()
	 */
	public async removeComponent(reference: ComponentReference) {
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
	public hasProperty(name: string) {
		return this.properties.hasProperty(name);
	}

	/**
	 * Alias for Bento.properties.setProperty()
	 * @param name Property name
	 * @param value Property value
	 *
	 * @see PropertyManager#setProperty
	 * @returns See Bento.properties.setProperty()
	 */
	public setProperty(name: string, value: any) {
		this.properties.setProperty(name, value);
	}

	/**
	 * Alias for Bento.properties.getProperty()
	 * @param name Property name
	 *
	 * @see PropertyManager#getProperty
	 * @returns See Bento.properties.getProperty()
	 */
	public getProperty(name: string) {
		return this.properties.getProperty(name);
	}

	/**
	 * Alias for Bento.properties.setProperties()
	 * @param properties Object with property key: value pairs
	 *
	 * @see PropertyManager#setProperties
	 * @returns See Bento.properties.setProperties()
	 */
	public setProperties(properties: { [key: string]: any }) {
		this.properties.setProperties(properties);
	}

	// VARIABLES Aliases

	/**
	 * Alias for Bento.variables.hasVariable()
	 * @param name Variable name
	 *
	 * @see VariableManager#hasVariable
	 * @returns See Bento.variables.hasVariable()
	 */
	public hasVariable(name: string) {
		return this.variables.hasVariable(name);
	}

	/**
	 * Alias for Bento.variables.getVariable()
	 * @param name Variable name
	 *
	 * @see VariableManager#getVariable
	 * @returns See Bento.variables.getVariable()
	 */
	public getVariable(name: string) {
		return this.variables.getVariable(name);
	}

	/**
	 * Alias for Bento.variables.setVariable()
	 * @param name Variable name
	 * @param value Variable value
	 *
	 * @see VariableManager#setVariable
	 * @returns See Bento.variables.setVariable()
	 */
	public setVariable(name: string, value: any) {
		this.variables.setVariable(name, value);
	}

	/**
	 * Alias for Bento.variables.deleteVariable()
	 * @param name Variable name
	 *
	 * @see VariableManager#deleteVariable
	 * @returns See Bento.variables.deleteVariable()
	 */
	public deleteVariable(name: string) {
		this.variables.deleteVariable(name);
	}

	/**
	 * Verifies the state of your Application, Will throw an error at anything
	 * "weird" looking. For example if any components are pending when this is
	 * called it will throw
	 *
	 * @returns Application state Object
	 */
	public async verify(): Promise<BentoState> {
		// check for any pending entities
		const pending = this.entities.getPendingEntities();
		if (pending.length > 0) {
			throw new IllegalStateError(`One or more entities are still in a pending state: '${pending.map(p => p.name).join('\', \'')}'`);
		}

		const state: BentoState = { components: [], plugins: [], variables: [] };

		// add component names
		const components = this.entities.getEntities(EntityType.COMPONENT);
		components.forEach(c => state.components.push(c.name));

		// add plugin names
		const plugins = this.entities.getEntities(EntityType.PLUGIN);
		plugins.forEach(p => state.plugins.push(p.name));

		// add variable names
		const variables = this.variables.getVariables();
		state.variables = Object.keys(variables);

		// freze object
		Object.freeze(state);

		return state;
	}
}
