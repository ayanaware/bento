import { Component, ComponentAPI } from '@ayanaware/bento';
import { Logger } from '@ayanaware/logger';

import { Parent } from './Parent';

const log = Logger.get();

export class Child implements Component {
	public name: string = 'Child';
	public api: ComponentAPI;
	public parent = Parent;

	public dependencies: Array<Component> = [];

	public async onLoad() {
		log.info('Hello Child!');
	}
}
