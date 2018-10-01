'use strict';

export interface SecondaryComponent {
	onMount(): Promise<void>;
	onUnmount(): Promise<void>;
	onEnable(): Promise<void>;
}