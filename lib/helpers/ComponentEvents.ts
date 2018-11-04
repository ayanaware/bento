'use strict';

import * as crypto from 'crypto';

import * as EventEmitter from 'eventemitter3';

import { IllegalArgumentError } from '@ayana/errors';
import { Logger } from '@ayana/logger';

import { SubscriptionType } from '../constants';
import { Subscriber } from '../interfaces/internal';

const log = Logger.get('ComponentEvents');

export class ComponentEvents {

	private emitter: EventEmitter = new EventEmitter();
	private subjectEmitter: EventEmitter = new EventEmitter();
	private subjects: Map<string, any> = new Map();

	private subscribers: Map<string, Subscriber> = new Map();

	constructor(private readonly name: string) {}

	private createID(len: number = 16): string {
		return crypto.randomBytes(len)
		.toString('base64')
		.replace(/[^a-z0-9]/gi, '')
		.slice(0, len);
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
		const subID = this.createID();
		const subscriber = function (...args: any[]) {
			handler(...args);
		};

		this.subscribers.set(subID, {
			handler: subscriber,
			name,
			type,
		});

		if (type === SubscriptionType.SUBJECT) {
			this.subjectEmitter.on(name, subscriber, context);

			// Instantly call the subscriber with the current state if there is one
			if (this.subjects.has(name)) {
				subscriber.call(context, this.getSubject(name));
			}
		} else if (type === SubscriptionType.EVENT) {
			this.emitter.on(name, subscriber, context);
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
