'use strict';

export interface Plugin {
	name: string;
	version?: string;

	onLoad?(): Promise<void>;
	onUnload?(): Promise<void>;
}
