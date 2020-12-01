import { Component, ComponentAPI } from '@ayanaware/bento';

import { ComponentA } from './ComponentA';
import { ComponentB } from './ComponentB';

import { Logger } from '@ayanaware/logger';
const log = Logger.get('ComponentC');

export class ComponentC implements Component {
	public name: string = 'ComponentC';
	public api: ComponentAPI;

	public dependencies: Array<Component> = [ComponentA, ComponentB];

	public async onLoad() {
		log.info(`Hello from "${this.name}"`);
	}
}
