'use strict';

import { Bento } from '../../Bento';
import { Component } from '../../components';

export interface Plugin {
	bento?: Bento;

	/**
	 * The name of this plugin
	 */
	name: string;
	version?: string;

	// Lifecycle events
	onLoad?(bento?: Bento): Promise<void>;
	onUnload?(): Promise<void>;

	// Plugin hooks
	onComponentLoad?(component: Component): Promise<void>;
	onComponentUnload?(component: Component): Promise<void>;
}
