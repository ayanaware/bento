
import { ComponentAPI, SubscribeEvent } from '@ayanaware/bento';

import { Logger } from '@ayana/logger';
const log = Logger.get('ExampleReferences');

export class ExampleReferences {
	public api: ComponentAPI;
	public name: string = 'ExampleReferences';

	public async onLoad() {
		this.api.emit('someEvent', 'hello', 'world');
	}

	// self event subscription using reference
	@SubscribeEvent(ExampleReferences, 'someEvent')
	private handleSomeEvent(arg1: string, arg2: string) {
		log.info(`Got "someEvent" from self subscription. Content = ${arg1} ${arg2}`);
	}
}
