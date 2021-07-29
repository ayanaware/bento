import { Component, ComponentAPI, Subscribe } from '@ayanaware/bento';
import { Logger } from '@ayanaware/logger';

import { Clock } from './Clock';
const log = Logger.get('ClockListener');

export class ClockListener implements Component {
	public name: string = 'ClockListener';
	public api: ComponentAPI;

	// The below @Subscribe actually automatically appends the dependency to this array.
	// So you actually don't need to include this line at all. However for the sake of the example
	// and non-ts users we have included this line
	public dependencies: Array<Component> = [Clock];

	private tickCount: number = 0;

	@Subscribe(Clock, 'tick') // for non-ts users you can achieve this via this.api.Subscribe
	private handleTick() {
		// this function will be called every second, see Clock.ts for why
		log.info(`${this.tickCount++} Tick-Tok goes the clock (hit ctrl-c to stop this example)`);
	}
}
