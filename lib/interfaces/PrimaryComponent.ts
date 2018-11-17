'use strict';

import { ComponentAPI } from '../helpers';
import { VariableDefinition } from './VariableDefinition';

export interface PrimaryComponent {
	api?: ComponentAPI;

	name: string;
	version?: string;
	dependencies?: PrimaryComponent[] | string[];
	variables?: VariableDefinition[];

	onLoad?(): Promise<void>;
	onUnload?(): Promise<void>;
}
