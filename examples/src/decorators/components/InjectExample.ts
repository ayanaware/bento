import { Component, ComponentAPI, Inject } from '@ayanaware/bento';

import { SubscribeExample } from './SubscribeExample';

import { Logger } from '@ayanaware/logger';
const log = Logger.get('InjectExample');

export class InjectExample {
	public name: string = 'InjectExample';
	public api: ComponentAPI;

	public dependencies: Array<Component> = [];

	@Inject(SubscribeExample) private subscribeExample: SubscribeExample

	public async onLoad() {
		log.info(`importantValue = ${this.subscribeExample.importantValue}`);
	}
}
