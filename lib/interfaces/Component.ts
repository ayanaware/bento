'use strict';

import { ComponentAPI } from '../helpers';
import { VariableDefinition } from './VariableDefinition';

export interface Component {
	api?: ComponentAPI;

	name: string;
	version?: string;

	parent?: Component | string;
	dependencies?: Array<Component | string>;
	variables?: VariableDefinition[];

	// General lifecycle events
	onLoad?(api?: ComponentAPI): Promise<void>;
	onUnload?(): Promise<void>;

	// Parent lifecycle events
	onChildLoad?(child: Component): Promise<void>;
	onChildUnload?(child: Component): Promise<void>;
}
