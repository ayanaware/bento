'use strict';

import { ComponentAPI } from "../helpers";
import { VariableDefinition } from "./VariableDefinition";

export interface SecondaryComponent {
	api?: ComponentAPI;

	name: string;
	version?: string;
	dependencies?: string[];
	variables?: VariableDefinition[];

	onLoad?(): Promise<void>;
	onUnload?(): Promise<void>;
}
