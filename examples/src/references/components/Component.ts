import { Component, ComponentAPI, Subscribe } from '@ayanaware/bento';

import { Logger } from '@ayanaware/logger';
const log = Logger.get('ExampleReferences');

export class ExampleReferences implements Component {
	public name: string = 'ExampleReferences';
	public api: ComponentAPI;

	public async onLoad() {
		this.api.emit('someEvent', 'hello', 'world');
	}

	// self event subscription using reference
	@Subscribe(ExampleReferences, 'someEvent')
	private handleSomeEvent(arg1: string, arg2: string) {
		log.info(`Got "someEvent" from self subscription. Content = ${arg1} ${arg2}`);
	}
}
