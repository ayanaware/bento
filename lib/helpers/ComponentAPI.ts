'use strict';

import { EventEmitter } from 'events';

import { IllegalArgumentError, IllegalStateError } from '@ayana/errors';
import { Logger } from '@ayana/logger';

import { SubscriptionType } from '../constants';

import { Bento } from '../Bento';

/**
 * WeakMap for storing the reference to the associated Bento instance
 * This is used to prevent components accessing the Bento instance
 * The map entry is deleted if there is no reference to the API instance anymore.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap
 */
const bentoRef = new WeakMap<ComponentAPI, Bento>();

/**
 * Logger instance for the ComponentAPI class
 */
const log = Logger.get('ComponentAPI');

/**
 * The gateway of a component to the rest of the application.
 * Each component (primary and secondary) gets one if loaded.
 */
export class ComponentAPI {

	/**
	 * The name of the component this API object belongs to
	 */
	private readonly name: string;

	/**
	 * Currently existing subscriptions of this component.
	 * The key is the namespace where a subscription was added,
	 * the value is an array of subscription ids on that namespace.
	 */
	private readonly subscriptions: Map<string, string[]> = new Map();

	public constructor(name: string, bento: Bento) {
		this.name = name;

		bentoRef.set(this, bento);
	}

	/**
	 * Fetch the provided primary component instance
	 *
	 * @param name - Primary component name
	 */
	public getPrimary(name: string) {
		const component = bentoRef.get(this).primary.get(name);
		if (!component) return null;

		return component;
	}

	// TODO: Add a error handler
	// TODO: Consider name and maybe change it
	/**
	 * Re-emits events from a standard event emitter into component events.
	 *
	 * @param fromEmitter - Emitter to re-emit from
	 * @param events - Events to watch for
	 *
	 * @throws IllegalStateError if the emitter on the current component wasn't initialized
	 * @throws IllegalArgumentError if fromEmitter is not an EventEmitter or events is not an array
	 */
	public forwardEvents(fromEmitter: EventEmitter, events: string[]) {
		const emitter = bentoRef.get(this).events.get(this.name);
		if (emitter == null) throw new IllegalStateError('PANIC! Something really bad has happened. Primary component emitter does not exist?');

		if (events != null && !Array.isArray(events)) {
			throw new IllegalArgumentError('events is not an array');
		}

		events.forEach(event => {
			fromEmitter.on(event, (...args) => {
				try {
					emitter.emit(event, ...args);
				} catch (e) {
					// TODO call error handler
				}
			});
		});
	}

	public async emit(eventName: string, ...args: any[]) {
		const emitter = bentoRef.get(this).events.get(this.name);
		if (emitter == null) throw new IllegalStateError('PANIC! Something really bad has happened. Primary component emitter does not exist?');

		emitter.emit(eventName, ...args);
	}

	public subscribe(type: SubscriptionType, namespace: string, name: string, handler: (...args: any[]) => void, context?: any) {
		// Get the namespace
		const events = bentoRef.get(this).events.get(namespace);
		if (events == null) throw new IllegalArgumentError('Namespace does not exist');

		const subID = events.subscribe(type, name, handler, context);

		// Register subscription so if the current component unloads we can remove all events
		// TODO If the namespace component unloads we need to remove that array
		if (!this.subscriptions.has(namespace)) this.subscriptions.set(namespace, []);
		this.subscriptions.get(namespace).push(subID);

		return subID;
	}

	public subscribeEvent(namespace: string, eventName: string, handler: (...args: any[]) => void, context?: any) {
		return this.subscribe(SubscriptionType.EVENT, namespace, eventName, handler, context);
	}

	public subscribeSubject(namespace: string, subjectName: string, handler: (...args: any[]) => void, context?: any) {
		return this.subscribe(SubscriptionType.SUBJECT, namespace, subjectName, handler, context);
	}

	public unsubscribe(namespace: string, subID: string) {
		// Check if the namespace exists
		const events = bentoRef.get(this).events.get(namespace);
		if (events == null) {
			log.warn(`Could not find events for namespace "${namespace}" while trying to unsubscribe`, this.name);
			return;
		}

		// Check if this subscriber actually exists
		const subscriber = this.subscriptions.get(namespace);
		if (subscriber == null || !subscriber.includes(subID)) throw new IllegalArgumentError(`Tried to unsubscribe from unknown subID "${subID}"`);

		// Unsubscribe
		events.unsubscribe(subID);

		// Remove subID
		subscriber.splice(subscriber.indexOf(subID), 1);
	}

	/**
	 * Unsubscribes from all events in a namespace or all events alltogether.
	 * This will automatically get called when your component gets unloaded
	 *
	 * @param namespace - Optional. A namespace where all events should be unsubscribed
	 */
	public unsubscribeAll(namespace?: string) {
		if (namespace != null) {
			// Get the namespace events
			const events = bentoRef.get(this).events.get(namespace);
			if (events == null) {
				log.warn(`Could not find events for namespace "${namespace}" while trying to unsubscribe`, this.name);
				return;
			}

			// Get subscriptions on that namespace
			const subscriptions = this.subscriptions.get(namespace);
			// No subscriptions on that namespace exist
			if (subscriptions == null) return;

			// Unsubscribe from all events
			for (const subID of subscriptions) {
				events.unsubscribe(subID);
			}

			// Remove array
			this.subscriptions.delete(namespace);
		} else {
			// No namespace was given so we unsubscribe everything
			for (const ns of this.subscriptions.keys()) {
				this.unsubscribeAll(ns);
			}
		}
	}
}
