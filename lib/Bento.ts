
import * as crypto from 'crypto';

import { IllegalStateError } from '@ayanaware/errors';

import { Component } from './components';
import { ComponentManager } from './components/internal';
import {
	BentoState,
	EventEmitterLike,
} from './interfaces';
import { Plugin } from './plugins';
import { PluginManager } from './plugins/internal';
import { PropertyManager } from './properties/internal';
import { ComponentReference, PluginReference } from './references';
import { LiteEmitter } from './util';
import { VariableManager } from './variables/internal';

export interface BentoOptions {
	createID?(len?: number): string;
	eventEmitter?(): EventEmitterLike;
}

export class Bento {
	public readonly properties: PropertyManager;
	public readonly variables: VariableManager;
	public readonly plugins: PluginManager;
	public readonly components: ComponentManager;

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
		this.plugins = new PluginManager(this);
		this.components = new ComponentManager(this);
	}

	// COMPONENTS Aliases

	/**
	 * Alias for Bento.components.addComponent()
	 * @param component Component
	 *
	 * @see ComponentManager#addComponent
	 * @returns See Bento.components.addComponent()
	 */
	public async addComponent(component: Component) {
		return this.components.addComponent(component);
	}

	/**
	 * Alias for Bento.components.getComponent()
	 * @param reference Component name or reference
	 *
	 * @see ComponentManager#getComponent
	 * @returns See Bento.components.getComponent()
	 */
	public async getComponent<T extends Component>(reference: ComponentReference) {
		return this.components.getComponent<T>(reference);
	}

	/**
	 * Alias for Bento.components.removeComponent()
	 * @param name Component name
	 *
	 * @see ComponentManager#removeComponent
	 * @returns See Bento.components.removeComponent()
	 */
	public async removeComponent(name: string) {
		return this.components.removeComponent(name);
	}

	// PLUGINS Aliases

	/**
	 * Alias for Bento.plugins.addPlugin()
	 * @param plugin Plugin
	 *
	 * @see PluginManager#addPlugin
	 * @returns See Bento.plugins.addPlugin()
	 */
	public async addPlugin(plugin: Plugin) {
		return this.plugins.addPlugin(plugin);
	}

	/**
	 * Alias for Bento.plugins.getPlugin()
	 * @param reference Plugin name or reference
	 *
	 * @see PluginManager#getPlugin
	 * @returns See Bento.plugins.getPlugin()
	 */
	public async getPlugin<T extends Plugin>(reference: PluginReference) {
		return this.plugins.getPlugin<T>(reference);
	}

	/**
	 * Alias for Bento.plugins.removePlugin()
	 * @param name Plugin name
	 *
	 * @see PluginManager#removePlugin
	 * @returns See Bento.plugins.removePlugin()
	 */
	public async removePlugin(name: string) {
		return this.plugins.removePlugin(name);
	}

	/**
	 * Alias for Bento.plugins.addPlugins()
	 * @param plugins Array of Plugins
	 *
	 * @see PluginManager#addPlugins
	 * @returns See Bento.plugins.addPlugins()
	 */
	public async addPlugins(plugins: Array<Plugin>) {
		return this.plugins.addPlugins(plugins);
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
		// check for any pending components
		const pending = this.components.getPendingComponents();
		if (pending.length > 0) {
			throw new IllegalStateError(`One or more components are still in a pending state: '${pending.map(p => p.name).join('\', \'')}'`);
		}

		const state: BentoState = { components: [], plugins: [], variables: [] };

		// add component names
		const components = this.components.getComponents();
		components.forEach(c => state.components.push(c.name));

		// add plugin names
		const plugins = this.plugins.getPlugins();
		plugins.forEach(p => state.plugins.push(p.name));

		// add variable names
		const variables = this.variables.getVariables();
		state.variables = Object.keys(variables);

		// freze object
		Object.freeze(state);

		return state;
	}
}
