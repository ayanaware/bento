'use strict';

import { ComponentAPI } from '../helpers';
import { ComponentVariableDefinition } from './ComponentVariableDefinition';

export interface Component {
	api?: ComponentAPI;

	name: string;
	version?: string;
	dependencies?: Component[] | string[];
	variables?: ComponentVariableDefinition[];

	onLoad?(): Promise<void>;
	onUnload?(): Promise<void>;
}
