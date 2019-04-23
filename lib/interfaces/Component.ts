'use strict';

import { ComponentAPI } from '../helpers';

import { ComponentReference } from '../@types/ComponentReference';
import { PluginReference } from '../@types/PluginReference';

export interface Component {
	api?: ComponentAPI;

	name: string;
	version?: string;

	dependencies?: Array<ComponentReference>;
	parent?: ComponentReference;

	plugins?: Array<PluginReference>;

	// General lifecycle events
	onLoad?(api?: ComponentAPI): Promise<void>;
	onUnload?(): Promise<void>;

	// Parent lifecycle events
	onChildLoad?(child: Component): Promise<void>;
	onChildUnload?(child: Component): Promise<void>;
}
