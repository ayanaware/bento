
import { IllegalArgumentError, ProcessingError } from '@ayanaware/errors';

import { BentoOptions } from '../../Bento';
import { EventEmitterLike } from '../../interfaces';

export type ComponentEventHandler = (...args: Array<any>) => void;

export interface ComponentEventSubscription {
	name: string;
	handler: ComponentEventHandler;
}

export class ComponentEvents {
	private readonly name: string;

	private readonly emitter: EventEmitterLike;
	private readonly subject: Map<string, Array<any>> = new Map();

	private subCount: number = 0;
	private readonly subscriptions: Map<number, ComponentEventSubscription> = new Map();

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
	public emit(name: string, ...args: Array<any>) {
		this.emitter.emit(name, ...args);
	}

	/**
	 * Emit Event and store as subject
	 * @param name Event name
	 * @param args Event args
	 */
	public emitSubject(name: string, ...args: Array<any>) {
		this.subject.set(name, args);
		this.emit(name, ...args);
	}

	/**
	 * Purges subject data for event
	 * @param name Event name
	 */
	public purgeSubject(name: string) {
		this.subject.delete(name);
	}

	public subscribe(name: string, handler: ComponentEventHandler, context?: any): number {
		const id = this.subCount++;

		// rewrap handler, if context provided
		if (context) handler = handler.bind(context);

		// if there is subject data for this event, call now
		if (this.subject.has(name)) {
			try {
				handler.call(context, this.subject.get(name));
			} catch (e) {
				throw new ProcessingError(`Failed to call subject handler for "${name}"`).setCause(e);
			}
		}

		// add handler to emitter
		this.emitter.addListener(name, handler);
		this.subscriptions.set(id, { name, handler });

		return id;
	}

	public unsubscribe(id?: number) {
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
