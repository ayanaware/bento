'use strict';

import { ComponentAPI } from '../helpers';
import { PrimaryComponent } from './PrimaryComponent';
import { VariableDefinition } from './VariableDefinition';

export interface SecondaryComponent {
	api?: ComponentAPI;

	name: string;
	version?: string;
	dependencies?: PrimaryComponent[] | string[];
	variables?: VariableDefinition[];

	onLoad?(): Promise<void>;
	onUnload?(): Promise<void>;
}
