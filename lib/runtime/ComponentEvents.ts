'use strict';

import * as crypto from 'crypto';

import * as EventEmitter from 'eventemitter3';

import { IllegalArgumentError } from '@ayana/errors';
import { Logger } from '@ayana/logger';

class ObjectMap<T> {

	private map: { [key: string]: T } = {};

	public get(key: string): T {
		return this.map[key];
	}

	public set(key: string, value: T) {
		this.map[key] = value;
	}

	public has(key: string) {
		return Object.prototype.hasOwnProperty.call(this.map, key);
	}

	public delete(key: string) {
		delete this.map[key];
	}

}

interface Subscriber {
	fn: (...args: any[]) => void;
	name: string;
	isSubject: boolean;
}

const log = Logger.get('ComponentEvents');

export class ComponentEvents {

	private emitter: EventEmitter = new EventEmitter();
	private subjectEmitter: EventEmitter = new EventEmitter();
	private subjects: ObjectMap<any> = new ObjectMap();

	private subscribers: ObjectMap<Subscriber> = new ObjectMap();

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

	private createSubscriber(name: string, handler: (...args: any[]) => void, context: any, isSubject: boolean): string {
		const subID = this.createID();
		const subscriber = function (...args: any[]) {
			handler(...args);
		};

		this.subscribers.set(subID, {
			fn: subscriber,
			name,
			isSubject,
		});

		if (isSubject) {
			this.subjectEmitter.on(name, subscriber, context);
		} else {
			this.emitter.on(name, subscriber, context);
		}

		return subID;
	}

	public subscribe(eventName: string, handler: (...args: any[]) => void, context?: any): string {
		return this.createSubscriber(eventName, handler, context, false);
	}

	public subscribeSubject(subjectName: string, handler: (...args: any[]) => void, context?: any): string {
		const subID = this.createSubscriber(subjectName, handler, context, true);

		// Instantly call the subscriber with the current state if there is one
		if (this.subjects.has(subjectName)) {
			this.subscribers.get(subID).fn.call(context, this.getSubject(subjectName));
		}

		return subID;
	}

	public unsubscribe(subID: string): void {
		// Check if this subscriber actually exists
		const subscriber = this.subscribers.get(subID);
		if (!subscriber) log.warn(`Something attempted to unsubscribe the subID "${subID}"`, this.name);

		// Unsubscribe from the specified emitter
		if (subscriber.isSubject) {
			this.subjectEmitter.removeListener(subscriber.name, subscriber.fn);
		} else {
			this.emitter.removeListener(subscriber.name, subscriber.fn);
		}

		// Delete the subscription
		this.subscribers.delete(subID);
	}

}
