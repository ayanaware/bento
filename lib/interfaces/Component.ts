'use strict';

import { ComponentAPI } from '../helpers';

import { Plugin } from './Plugin';
import { VariableDefinition } from './VariableDefinition';

export interface Component {
	api?: ComponentAPI;

	name: string;
	version?: string;

	parent?: Component | string;

	plugins: Array<Plugin | string>;
	dependencies?: Array<Component | string>;
	variables?: Array<VariableDefinition>;

	// General lifecycle events
	onLoad?(api?: ComponentAPI): Promise<void>;
	onUnload?(): Promise<void>;

	// Parent lifecycle events
	onChildLoad?(child: Component): Promise<void>;
	onChildUnload?(child: Component): Promise<void>;
}
