import type { PluginAPI } from '../api/PluginAPI';

import type { Component } from './Component';
import type { EntityType } from './Entity';
import { Entity } from './Entity';

export interface Plugin extends Entity {
	type?: EntityType.PLUGIN;
	api?: PluginAPI;

	/** Lifecycle: Called right before Component is fully loaded */
	onLoad?(api?: PluginAPI): Promise<unknown>;

	/**
	 * Plugin Lifecycle Hook, Plugin unload
	 */
	onUnload?(): Promise<unknown>;

	/**
	 * Component Lifecycle Hook, Called prior to component onLoad
	 * @param component Component
	 */
	onPreComponentLoad?(component: Component): Promise<unknown>;

	/**
	 * Component Lifecycle Hook, Called prior to the component onUnload
	 * @param component Component
	 */
	onPreComponentUnload?(component: Component): Promise<unknown>;

	/**
	 * Component Lifecycle Hook, Called after component onLoad
	 * @param component Component
	 */
	onPostComponentLoad?(component: Component): Promise<unknown>;

	/**
	 * Component Lifecycle Hook, Called after component onUnload
	 * @param component Component
	 */
	onPostComponentUnload?(component: Component): Promise<unknown>;
}
