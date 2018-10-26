'use strict';

export interface SecondaryComponent {
	name: string;

	onLoad(): Promise<void>;
	onUnload(): Promise<void>;
}
