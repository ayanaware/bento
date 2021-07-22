import { PluginAPI } from '../api/PluginAPI';

import { Component } from './Component';
import { Entity, EntityType } from './Entity';

export interface Plugin extends Entity {
	type?: EntityType.PLUGIN;
	api?: PluginAPI;

	/**
	 * Plugin Lifecycle Hook, Plugin Entrypoint
	 * @param api Plugin API
	 */
	onLoad?(api?: PluginAPI): Promise<void>;

	/**
	 * Plugin Lifecycle Hook, Plugin unload
	 */
	onUnload?(): Promise<void>;

	/**
	 * Component Lifecycle Hook, Called prior to component onLoad
	 * @param component Component
	 */
	onPreComponentLoad?(component: Component): Promise<void>;

	/**
	 * Component Lifecycle Hook, Called prior to the component onUnload
	 * @param component Component
	 */
	onPreComponentUnload?(component: Component): Promise<void>;

	/**
	 * Component Lifecycle Hook, Called after component onLoad
	 * @param component Component
	 */
	onPostComponentLoad?(component: Component): Promise<void>;

	/**
	 * Component Lifecycle Hook, Called after component onUnload
	 * @param component Component
	 */
	onPostComponentUnload?(component: Component): Promise<void>;
}
