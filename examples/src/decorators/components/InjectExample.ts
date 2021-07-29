import { Component, ComponentAPI, Inject } from '@ayanaware/bento';
import { Logger } from '@ayanaware/logger';

import { SubscribeExample } from './SubscribeExample';

const log = Logger.get('InjectExample');

export class InjectExample {
	public name: string = 'InjectExample';
	public api: ComponentAPI;

	public dependencies: Array<Component> = [];

	@Inject(SubscribeExample) private readonly subscribeExample: SubscribeExample;

	public async onLoad() {
		log.info(`importantValue = ${this.subscribeExample.importantValue}`);
	}
}
