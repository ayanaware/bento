'use strict';

import { ComponentManager } from "./ComponentManager";

export class ComponentAPI {
	private readonly name: string;
	private readonly manager: ComponentManager;

	private readonly subscribers: Map<string, () => void>;

	constructor(name: string, manager: ComponentManager) {
		this.name = name;
		this.manager = manager;

		this.subscribers = new Map();
	}

	/**
	 * Fetch the provided primary component instance
	 * @param name - Primary component name
	 */
	getPrimary(name: string) {
		const component = this.manager.primary.get(name);
		if (!component) return null;

		return component;
	}

	public async emit(eventName: string, ...args: any[]) {
		const emitter = this.manager.events.get(this.name);
		if (!emitter) throw new Error('PANIC! Something really bad has happened. Primary Component emitter does not exist?');

		emitter.emit(eventName, ...args);
	}

	public async subscribe(namespace: string, eventName: string, handler: (...args: any[]) => void) {
		// check if the namespace exists
		const emitter = this.manager.events.get(namespace);
		if (!emitter) throw new Error('Namespace does not exist!');

		// create a new subscriber
		const subID = this.manager.createID();
		const subscriber = (...args: any[]) => {
			handler(...args);
		};


		this.subscribers.set(subID, subscriber);
		emitter.on(eventName, subscriber);

		return subID;
	}

	public async unsubscribe(namespace: string, eventName: string, subID: string) {
		// check if the namespace exists
		const emitter = this.manager.events.get(namespace);
		if (!emitter) throw new Error('Namespace does not exist!');

		// check if this subscriber actually exists
		const subscriber = this.subscribers.get(subID);
		if (!subscriber) throw new Error('Subscriber does not exist');

		emitter.removeListener(eventName, subscriber);
		this.subscribers.delete(subID);
	}
}
