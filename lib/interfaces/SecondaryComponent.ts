'use strict';

export interface SecondaryComponent {
	name: string;
	version?: string;
	dependencies?: string[];

	onLoad?(): Promise<void>;
	onUnload?(): Promise<void>;
}
