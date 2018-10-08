'use strict';

export interface SecondaryComponent {
	id: string;

	onMount(): Promise<void>;
	onUnmount(): Promise<void>;
}
