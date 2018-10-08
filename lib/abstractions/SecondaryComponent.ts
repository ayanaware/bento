'use strict';

export class SecondaryComponent {
	public id: string;

	public async onMount() {}
	public async onUnmount() {}

	public async subscribe(namespace: string, eventName: string, handler: () => void) {
	}

	public async unsubscribe(namespace: string, eventName: string, handlerID: string) {
	}
}
