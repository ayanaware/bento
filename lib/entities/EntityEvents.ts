
import { IllegalArgumentError, ProcessingError } from '@ayanaware/errors';

import type { BentoOptions } from '../Bento';
import { EventEmitterLike } from '../interfaces/EventEmitterLike';

export type EntityEventHandler = (...args: Array<any>) => void;
export interface EntityEventSubscription {
	name: string;
	handler: EntityEventHandler;
}

export class EntityEvents {
	private readonly name: string;

	private readonly emitter: EventEmitterLike;
	private readonly subject: Map<string, Array<any>> = new Map();

	private subCount: number = 0;
	private readonly subscriptions: Map<number, EntityEventSubscription> = new Map();

	private readonly options: BentoOptions;

	public constructor(name: string, options: BentoOptions) {
		this.name = name;
		this.options = options;

		// create new emitter
		this.emitter = this.options.eventEmitter();

		// prevent throwing of 'error' events
		this.emitter.addListener('error', () => { /* no op */ });
	}

	/**
	 * Emit Event
	 * @param name Event name
	 * @param args Event args
	 */
	public emit(name: string, ...args: Array<any>): void {
		this.emitter.emit(name, ...args);
	}

	/**
	 * Emit Event and store as subject
	 * @param name Event name
	 * @param args Event args
	 */
	public emitSubject(name: string, ...args: Array<any>): void {
		this.subject.set(name, args);
		this.emit(name, ...args);
	}

	/**
	 * Purges subject data for event
	 * @param name Event name
	 */
	public purgeSubject(name: string): void {
		this.subject.delete(name);
	}

	public subscribe(name: string, handler: EntityEventHandler, context?: unknown): number {
		const id = this.subCount++;

		// rewrap handler, if context provided
		if (context) handler = handler.bind(context);

		// if there is subject data for this event, call now
		if (this.subject.has(name)) {
			try {
				handler.call(context, this.subject.get(name));
			} catch (e) {
				throw new ProcessingError(`Failed to call subject handler for "${name}"`).setCause(e as Error);
			}
		}

		// add handler to emitter
		this.emitter.addListener(name, handler);
		this.subscriptions.set(id, { name, handler });

		return id;
	}

	public unsubscribe(id?: number): void {
		if (typeof id !== 'undefined') {
			if (typeof id !== 'number') throw new IllegalArgumentError('If given an argument, it must be number');
			const subscription = this.subscriptions.get(id);
			if (!subscription) return;

			this.emitter.removeListener(subscription.name, subscription.handler);
			this.subscriptions.delete(id);
		} else {
			// called with no id, remove all subscriptions
			for (const [subId, subscription] of this.subscriptions.entries()) {
				this.emitter.removeListener(subscription.name, subscription.handler);
				this.subscriptions.delete(subId);
			}
		}
	}
}
