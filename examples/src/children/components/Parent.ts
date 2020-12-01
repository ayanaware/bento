import { Component, ComponentAPI } from '@ayanaware/bento';

import { Logger } from '@ayanaware/logger';
const log = Logger.get();

export class Parent implements Component {
	public name: string = 'Parent';
	public api: ComponentAPI;

	public dependencies: Array<Component> = [];

	public async onLoad() {
		log.info('Hello Parent!');
	}
}
