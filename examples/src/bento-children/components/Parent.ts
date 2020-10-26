
import { Component, ComponentAPI } from '@ayanaware/bento';

import { Logger } from '@ayana/logger';
const log = Logger.get('ExampleComponent');

export class ExampleComponent {
	public name: string = 'ExampleComponent';
	public api: ComponentAPI;

	public dependencies: Array<Component> = [];

	public async onLoad() {
		log.info('Hello world!');
	}
}
