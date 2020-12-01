import { Component, ComponentAPI } from '@ayanaware/bento';

import { Logger } from '@ayanaware/logger';
const log = Logger.get('ExampleComponent');

export class ExampleComponent implements Component {
	public api: ComponentAPI;
	public name: string = 'ExampleComponent';

	public async onLoad() {
		log.info('Hello world!');
	}
}
