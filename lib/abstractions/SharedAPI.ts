
import { IllegalArgumentError, IllegalStateError } from '@ayana/errors';

import { Bento } from '../Bento';

import { ComponentReference, PluginReference } from '../references';

import { VariableDefinition } from '../variables';

import { Component } from '../components';
import { Plugin } from '../plugins';

/**
 * Shared functions for ComponentAPI and PluginAPI
 */
export class SharedAPI {
	protected readonly bento: Bento;

	public constructor(bento: Bento) {
		this.bento = bento;
	}

	/**
	 * Get the semantic version string of the bento instance attached to this component api
	 * @returns Semantic version string (https://semver.org)
	 */
	public getBentoVersion() {
		return this.bento.version;
	}

	/**
	 * Check if bento has a given property
	 * @param name name of property
	 *
	 * @returns boolean
	 */
	public hasProperty(name: string) {
		return this.bento.properties.hasProperty(name);
	}

	/**
	 * Fetch the value of given application property
	 * @param name name of application property
	 *
	 * @returns Property value
	 */
	public getProperty(name: string) {
		return this.bento.getProperty(name);
	}

	/**
	 * Check if bento has a given variable
	 * @param name name of variable
	 *
	 * @returns boolean
	 */
	public hasVariable(name: string) {
		return this.bento.variables.hasVariable(name);
	}

	/**
	 * Gets the value of a variable
	 * @param definition Variable name or definition
	 *
	 * @returns Variable value
	 */
	public getVariable<T>(definition: VariableDefinition | string): T {
		// if string, convert to basic definition
		if (typeof definition === 'string') {
			definition = {
				name: definition,
			};
		}

		// validate definition
		if (!definition.name) throw new IllegalArgumentError('VariableDefinition must define a name');

		const value = this.bento.variables.getVariable<T>(definition.name, definition.default);

		// if undefined. then is a required variable that is not in bento
		if (value === undefined) throw new IllegalStateError(`Failed to find a value for "${definition.name}" variable`);

		return value;
	}

	/**
	 * Check if Bento has a given plugin
	 *
	 * @param reference Plugin instance, name or reference
	 *
	 * @returns boolean
	 */
	public hasPlugin(reference: PluginReference) {
		return this.bento.plugins.hasPlugin(reference);
	}

	/**
	 * Fetch the provided plugin instance
	 *
	 * @param reference Plugin name or reference
	 *
	 * @returns Plugin instance
	 */
	public getPlugin<T extends Plugin>(reference: PluginReference): T {
		const name = this.bento.plugins.resolveName(reference);
		const plugin = this.bento.plugins.getPlugin<T>(name);
		if (!plugin) throw new IllegalStateError(`Plugin "${name}" does not exist`);

		return plugin;
	}

	/**
	 * Checks if Bento has a given component
	 *
	 * @param reference Component instance, name or reference
	 *
	 * @returns boolean
	 */
	public hasComponent(reference: ComponentReference) {
		return this.bento.components.hasComponent(reference);
	}

	/**
	 * Fetch the provided component instance
	 *
	 * @param reference Component name or reference
	 *
	 * @returns Component instance
	 */
	public getComponent<T extends Component>(reference: ComponentReference): T {
		const name = this.bento.components.resolveName(reference);
		const component = this.bento.components.getComponent<T>(name);
		if (!component) throw new IllegalStateError(`Component "${name}" does not exist`);

		return component;
	}
}
