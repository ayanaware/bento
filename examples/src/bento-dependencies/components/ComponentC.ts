
import { Component, ComponentAPI } from '@ayana/bento';

import { ComponentA } from './ComponentA';
import { ComponentB } from './ComponentB';

import { Logger } from '@ayana/logger';
const log = Logger.get('ComponentC');

export class ComponentC {
	public api: ComponentAPI;
	public name: string = 'ComponentC';

	public dependencies: Array<Component> = [ComponentA, ComponentB];

	public async onLoad() {
		log.info(`Hello from "${this.name}"`);
	}
}
