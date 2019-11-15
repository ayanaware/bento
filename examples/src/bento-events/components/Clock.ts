
import { Component, ComponentAPI } from '@ayanaware/bento';

import { EventEmitter } from 'events';

import { Logger } from '@ayana/logger';
const log = Logger.get('Clock');

export class Clock {
	public api: ComponentAPI;
	public name: string = 'Clock';

	// While not required in this instance. Still a good habit to get into including
	public dependencies: Array<Component> = [];

	private interval: NodeJS.Timeout;

	public async onLoad() {
		// create a interval and send a event on component events every sec
		this.interval = setInterval(() => {
			this.api.emit('tick'); // emit the component event
		}, 1000);

		// If you had a normal event emitter and needed to forward those events to component events
		// This can be done via `this.api.forwardEvents`, a simple example:
		const emitter = new EventEmitter();
		this.api.forwardEvents(emitter, ['someEvent']);

		emitter.emit('someEvent'); // this will also emit the `Clock.someEvent` component event behind the scenes
	}

	public async onUnload() {
		clearInterval(this.interval);
	}
}
