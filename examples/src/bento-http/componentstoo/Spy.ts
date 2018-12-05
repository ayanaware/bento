'use strict';

import { ComponentAPI } from '@ayana/bento';
import { Logger } from '@ayana/logger';
import { HitCounter } from '../primary/HitCounter';

const log = Logger.get('Spy');

export class Spy {
	public api: ComponentAPI;

	// this does not do anything for secondary components right now
	public dependencies: string[] = ['HTTPServer'];

	async onLoad() {
		// alternative way to subscribe to component events, you can also sub by reference which can be seen in EveryTen Component
		this.api.subscribeEvent('HTTPServer', 'httpHit', this.handleHit, this);
	}

	handleHit(address: string, port: number) {
		const counter = this.api.getPrimary<HitCounter>(HitCounter);
		log.info(`Got HTTP hit from: '${address}:${port}'. Been hit "${counter.getTotalHits()}" times now!`);
	}
}
