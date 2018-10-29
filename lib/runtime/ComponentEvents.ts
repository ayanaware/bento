'use strict';

import * as crypto from 'crypto';

import * as EventEmitter from 'eventemitter3';

export class ComponentEvents {

	private _emitter: EventEmitter = new EventEmitter();
	private _subscribers: Map<string, (...args: any[]) => void> = new Map();
	private _subjects: { [key: string]: any } = {};

	private createID(len: number = 16): string {
		return crypto.randomBytes(len)
		.toString('base64')
		.replace(/[^a-z0-9]/gi, '')
		.slice(0, len);
	}

	public hasSubject(name: string) {
		return Object.prototype.hasOwnProperty.call(this._subjects, name);
	}

	public getSubject(name: string): any {
		if (!this.hasSubject(name)) {
			throw new Error('Subject does not exist');
		}

		return this._subjects[name];
	}

	public createSubject(name: string, value: any) {
		if (this.hasSubject(name)) {
			throw new Error('Subject already exists');
		}

		this._subjects[name] = value;
		this._emitter.emit(name, this._subjects[name]);
	}

	public updateSubject(name: string, value: any) {
		if (!this.hasSubject(name)) {
			throw new Error('Subject does not exist');
		}

		this._subjects[name] = value;
		this._emitter.emit(name, this._subjects[name]);
	}

	public deleteSubject(name: string) {
		if (!this.hasSubject(name)) {
			throw new Error('Subject does not exist');
		}

		delete this._subjects[name];
		this._emitter.emit(name, void 0);
	}

	public subscribe(eventName: string, handler: (...args: any[]) => void, context?: any): string {
		// create a new subscriber
		const subID = this.createID();
		const subscriber = function (...args: any[]) {
			handler(...args);
		};

		this._subscribers.set(subID, subscriber);
		this._emitter.on(eventName, subscriber, context);

		if (this.hasSubject(eventName)) {
			subscriber.call(context, this.getSubject(eventName));
		}

		return subID;
	}

	public unsubscribe(eventName: string, subID: string): void {
		// check if this subscriber actually exists
		const subscriber = this._subscribers.get(subID);
		if (!subscriber) throw new Error('Subscriber does not exist');

		this._emitter.removeListener(eventName, subscriber);
		this._subscribers.delete(subID);
	}

}
