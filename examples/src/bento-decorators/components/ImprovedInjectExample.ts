
import { Component, ComponentAPI, Inject } from '@ayanaware/bento';

import { SubscribeExample } from './SubscribeExample';

import { Logger } from '@ayana/logger';
const log = Logger.get('ImprovedInjectExample');

export class ImprovedInjectExample {
	public name: string = 'ImprovedInjectExample';
	public api: ComponentAPI;

	public dependencies: Array<Component> = [];

	@Inject() private subscribeExample: SubscribeExample

	public async onLoad() {
		log.info(`importantValue = ${this.subscribeExample.importantValue}`);
	}
}
