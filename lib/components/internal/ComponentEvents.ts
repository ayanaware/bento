'use strict';

import { IllegalArgumentError } from '@ayana/errors';

import { BentoOptions } from '../../Bento';

import { SubscriptionType } from '../SubscriptionType';

import { EventEmitterLike } from '../../interfaces';
import { Subscriber } from '../../interfaces/internal';

import { Logger } from '@ayana/logger-api';

/**
 * @ignore
 */
const log = Logger.get('ComponentEvents');

export class ComponentEvents {
	private readonly name: string;

	private emitter: EventEmitterLike;
	private subjectEmitter: EventEmitterLike;

	private subjects: Map<string, any> = new Map();
	private subscribers: Map<string, Subscriber> = new Map();

	private options: BentoOptions;

	constructor(name: string, options: BentoOptions) {
		this.name = name;
		this.options = options;

		this.emitter = this.options.eventEmitter();
		this.subjectEmitter = this.options.eventEmitter();

		// prevent throwing of 'error' events
		this.emitter.addListener('error', () => { /* no op */ });
		this.subjectEmitter.addListener('error', () => { /* no op */ });
	}

	public getSubject(name: string): any {
		return this.subjects.get(name);
	}

	public updateSubject(name: string, value: any) {
		if (value === undefined) {
			throw new IllegalArgumentError('Cannot set subject value to undefined. Use deleteSubject() to remove the subject');
		}

		this.subjects.set(name, value);
		this.subjectEmitter.emit(name, value);
	}

	public deleteSubject(name: string) {
		this.subjects.delete(name);
		this.subjectEmitter.emit(name, undefined);
	}

	public emit(eventName: string, ...args: any[]) {
		this.emitter.emit(eventName, ...args);
	}

	public subscribe(type: SubscriptionType, name: string, handler: (...args: any[]) => void, context: any): string {
		const subID = this.options.createID();

		// wrap handler
		const subscriber = (...args: any[]) => handler.apply(context, args);

		this.subscribers.set(subID, {
			handler: subscriber,
			name,
			type,
		});

		if (type === SubscriptionType.SUBJECT) {
			this.subjectEmitter.addListener(name, subscriber);

			// Instantly call the subscriber with the current state if there is one
			if (this.subjects.has(name)) {
				subscriber.call(context, this.getSubject(name));
			}
		} else if (type === SubscriptionType.EVENT) {
			this.emitter.addListener(name, subscriber);
		} else {
			throw new IllegalArgumentError(`Invalid subscription type "${type}"`);
		}

		return subID;
	}

	public subscribeEvent(eventName: string, handler: (...args: any[]) => void, context?: any): string {
		return this.subscribe(SubscriptionType.EVENT, eventName, handler, context);
	}

	public subscribeSubject(subjectName: string, handler: (...args: any[]) => void, context?: any): string {
		return this.subscribe(SubscriptionType.SUBJECT, subjectName, handler, context);
	}

	public unsubscribe(subID: string): void {
		// Check if this subscriber actually exists
		const subscriber = this.subscribers.get(subID);
		if (!subscriber) log.warn(`Something attempted to unsubscribe the subID "${subID}"`, this.name);

		// Unsubscribe from the specified emitter
		if (subscriber.type === SubscriptionType.EVENT) {
			this.emitter.removeListener(subscriber.name, subscriber.handler);
		} else if (subscriber.type === SubscriptionType.SUBJECT) {
			this.subjectEmitter.removeListener(subscriber.name, subscriber.handler);
		}

		// Delete the subscription
		this.subscribers.delete(subID);
	}
}
