'use strict';

import { ComponentAPI } from '../helpers';
import { VariableDefinition } from './VariableDefinition';

export interface Component {
	api?: ComponentAPI;

	name: string;
	version?: string;
	dependencies?: Component[] | string[];
	variables?: VariableDefinition[];

	onLoad?(): Promise<void>;
	onUnload?(): Promise<void>;
}
