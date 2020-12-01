import { Component, ComponentAPI } from '@ayanaware/bento';

import { Logger } from '@ayanaware/logger';
const log = Logger.get('ComponentA');

export class ComponentA implements Component {
	public name: string = 'ComponentA';
	public api: ComponentAPI;

	public dependencies: Array<Component> = [];

	public async onLoad() {
		log.info(`Hello from "${this.name}"`);
	}

	public method(callerName: string) {
		return `Hello Component "${callerName}"!`;
	}
}
