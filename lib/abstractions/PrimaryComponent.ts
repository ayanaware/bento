'use strict';

export interface PrimaryComponent {
	name: string;
	dependencies?: string[];
	required?: boolean,

	onLoad?(): Promise<void>;
	onUnload?(): Promise<void>;
}
