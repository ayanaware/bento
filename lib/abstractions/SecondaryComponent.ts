'use strict';

export interface SecondaryComponent {
	name: string;
	dependencies?: string[];

	onLoad(): Promise<void>;
	onUnload(): Promise<void>;
}
