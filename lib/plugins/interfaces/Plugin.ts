
import { Bento } from '../../Bento';
import { Component } from '../../components';
import { PluginAPI } from '../PluginAPI';

export interface Plugin {
	api?: PluginAPI;

	/**
	 * The name of this plugin
	 */
	name: string;
	version?: string;

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
