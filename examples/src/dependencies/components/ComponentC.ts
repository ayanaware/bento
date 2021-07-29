import { Component, ComponentAPI } from '@ayanaware/bento';
import { Logger } from '@ayanaware/logger';

import { ComponentA } from './ComponentA';
import { ComponentB } from './ComponentB';

const log = Logger.get('ComponentC');

export class ComponentC implements Component {
	public name: string = 'ComponentC';
	public api: ComponentAPI;

	public dependencies: Array<Component> = [ComponentA, ComponentB];

	public async onLoad() {
		log.info(`Hello from "${this.name}"`);
	}
}
