
import { Component, ComponentAPI } from '@ayana/bento';

import { Logger } from '@ayana/logger';
const log = Logger.get('ComponentA');

export class ComponentA {
	public api: ComponentAPI;
	public name: string = 'ComponentA';

	public dependencies: Array<Component> = [];

	public async onLoad() {
		log.info(`Hello from "${this.name}"`);
	}

	public method(callerName: string) {
		return `Hello Component "${callerName}"!`;
	}
}
