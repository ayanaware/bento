'use strict';

import * as crypto from 'crypto';

import { Component, Plugin } from './interfaces';

import { ComponentManager, PluginManager, PropertyManager, VariableManager } from './managers';
import { SetProperties } from './managers';

export interface BentoOptions {}

export class Bento {
	public readonly components: ComponentManager = new ComponentManager(this);

	public readonly plugins: PluginManager = new PluginManager(this);

	public readonly properties: PropertyManager = new PropertyManager(this);

	public readonly variables: VariableManager = new VariableManager(this);

	/**
	 * @ignore
	 */
	public readonly opts: BentoOptions;

	constructor(opts?: BentoOptions) {
		this.opts = opts;
	}

	/**
	 * Generates a uniqueID
	 * @param len - length of id
	 */
	public createID(len: number = 16) {
		return crypto.randomBytes(len)
			.toString('base64')
			.replace(/[^a-z0-9]/gi, '')
			.slice(0, len);
	}

	// COMPONENTS Proxy

	public async addComponent(component: Component) {
		return this.components.addComponent(component);
	}

	public async removeComponent(name: string) {
		return this.components.removeComponent(name);
	}

	// PLUGINS Proxy

	public async addPlugin(plugin: Plugin) {
		return this.plugins.addPlugin(plugin);
	}

	public async removePlugin(name: string) {
		return this.plugins.removePlugin(name);
	}

	public async addPlugins(plugins: Plugin[]) {
		return this.plugins.addPlugins(plugins);
	}

	// PROPERTIES Proxy

	public hasProperty(name: string) {
		return this.properties.hasProperty(name);
	}

	public setProperty(name: string, value: any) {
		return this.properties.setProperty(name, value);
	}

	public getProperty(name: string) {
		return this.properties.getProperty(name);
	}

	public setProperties(properties: SetProperties) {
		return this.properties.setProperties(properties);
	}

	// VARIABLES Proxy

	public hasVariable(name: string) {
		return this.variables.hasVariable(name);
	}

	public getVariable(name: string) {
		return this.variables.getVariable(name);
	}

	public setVariable(name: string, value: any) {
		return this.variables.setVariable(name, value);
	}

	public deleteVariable(name: string) {
		return this.variables.deleteVariable(name);
	}
}
