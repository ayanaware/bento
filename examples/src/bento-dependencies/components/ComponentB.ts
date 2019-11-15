
import { Component, ComponentAPI } from '@ayanaware/bento';

import { ComponentA } from './ComponentA';

import { Logger } from '@ayana/logger';
const log = Logger.get('ComponentB');

export class ComponentB {
	public api: ComponentAPI;
	public name: string = 'ComponentB';

	public dependencies: Array<Component> = [ComponentA];

	public async onLoad() {
		log.info(`Hello from "${this.name}"`);

		// fetch a reference to ComponentA so we can use "ComponentA.method()"
		const componentA = this.api.getComponent<ComponentA>(ComponentA);
		const result = componentA.method(this.name);
		log.info(`Result of Calling "ComponentA.method()": ${result}`);
	}
}
