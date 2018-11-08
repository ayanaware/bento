'use strict';

import { ComponentAPI } from "../helpers";

export interface SecondaryComponent {
	api?: ComponentAPI;

	name: string;
	version?: string;
	dependencies?: string[];

	onLoad?(): Promise<void>;
	onUnload?(): Promise<void>;
}
