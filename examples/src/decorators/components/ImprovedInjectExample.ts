import { Component, ComponentAPI, Inject } from '@ayanaware/bento';
import { Logger } from '@ayanaware/logger';

import { SubscribeExample } from './SubscribeExample';

const log = Logger.get('ImprovedInjectExample');

export class ImprovedInjectExample {
	public name: string = 'ImprovedInjectExample';
	public api: ComponentAPI;

	public dependencies: Array<Component> = [];

	@Inject() private readonly subscribeExample: SubscribeExample;

	public async onLoad() {
		log.info(`importantValue = ${this.subscribeExample.importantValue}`);
	}
}
