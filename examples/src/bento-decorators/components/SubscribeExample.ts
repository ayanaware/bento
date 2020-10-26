
import { Component, ComponentAPI, Subscribe } from '@ayanaware/bento';

import { Logger } from '@ayana/logger';
const log = Logger.get('SubscribeExample');

const eventName = 'exampleEvent';

export class SubscribeExample {
	public name: string = 'SubscribeExample';
	public api: ComponentAPI;

	public dependencies: Array<Component> = [];

	public importantValue = 42;

	public async onLoad() {
		this.api.emit(eventName, 'hello world');
	}

	@Subscribe(SubscribeExample, eventName)
	private async handleEvent(arg: string) {
		log.info(arg);
	}
}
