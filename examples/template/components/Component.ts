
import { Component, ComponentAPI } from '@ayana/bento';

import { Logger } from '@ayana/logger';
const log = Logger.get('ExampleComponent');

export class ExampleComponent {
	public api: ComponentAPI;
	public name: string = 'ExampleComponent';

	public dependencies: Array<Component> = [];

	public async onLoad() {
		log.info('Hello world!');
	}
}
