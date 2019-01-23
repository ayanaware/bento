
import { Component, ComponentAPI, SubscribeEvent } from '@ayana/bento';

import { Clock } from './Clock';

import { Logger } from '@ayana/logger';
const log = Logger.get('ClockListener');

export class ClockListener {
	public api: ComponentAPI;
	public name: string = 'ClockListener';

	// The below @SubscribeEvent actually automatically appends the dependency to this array.
	// So you actually don't need to include this line at all. However for the sake of the example
	// and non-ts users we have included this line
	public dependencies: Array<Component> = [Clock];

	private tickCount: number = 0;

	@SubscribeEvent(Clock, 'tick') // for non-ts users you can achieve this via this.api.subscribeEvent
	private handleTick() {
		// this function will be called every second, see Clock.ts for why
		log.info(`${this.tickCount++} Tick-Tok goes the clock (hit ctrl-c to stop this example)`);
	}
}
