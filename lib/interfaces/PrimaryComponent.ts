'use strict';

export interface PrimaryComponent {
	name: string;
	version?: string;
	dependencies?: string[];

	onLoad?(): Promise<void>;
	onUnload?(): Promise<void>;
}
