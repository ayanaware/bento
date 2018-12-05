'use strict';

import { ComponentAPI, SubscribeEvent } from '@ayana/bento';

export class HitCounter {
	public api: ComponentAPI;
	public name: string = 'HitCounter';

	private count: number = 0;

	public incrementHit(by: number) {
		this.count = this.count + by;
	}

	public getTotalHits() {
		return this.count;
	}
}
