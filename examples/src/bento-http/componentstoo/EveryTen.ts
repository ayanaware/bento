'use strict';

import { ComponentAPI } from '@ayana/bento';
import { Logger } from '@ayana/logger';
import { HitCounter } from '../primary/HitCounter';
import { HTTPServer } from '../primary/HTTPServer';

const log = Logger.get('EveryTen');

export class EveryTen {
	public api: ComponentAPI;

	// this does not do anything for secondary components right now
	public dependencies: string[] = ['HTTPServer'];

	async onLoad() {
		// alternative way to subscribe to component events
		this.api.subscribeEvent(HTTPServer, 'httpHit', this.handleHit, this);
	}

	handleHit(address: string, port: number) {
		const counter = this.api.getPrimary<HitCounter>('HitCounter');

		if (counter.getTotalHits() % 10 === 0) {
			log.info('Ten more hits!! Fiesta!!');
		}
	}
}
