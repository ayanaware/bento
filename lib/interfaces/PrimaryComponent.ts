'use strict';

export interface PrimaryComponent {
	name: string;
	dependencies?: string[];

	onLoad?(): Promise<void>;
	onUnload?(): Promise<void>;
}
