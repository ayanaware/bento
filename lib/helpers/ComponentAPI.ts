'use strict';

import { EventEmitter } from 'events';

import { IllegalArgumentError, IllegalStateError } from '@ayana/errors';
import { Logger } from '@ayana/logger';

import { Bento } from '../Bento';

import { SubscriptionType } from '../constants';
import { VariableDefinition } from '../interfaces';

/**
 * Logger instance for the ComponentAPI class
 *
 * @ignore
 */
const log = Logger.get('ComponentAPI');

/**
 * The gateway of a component to the rest of the application.
 * Each component (primary and secondary) gets one if loaded.
 */
export class ComponentAPI {
	private readonly bento: Bento;

	/**
	 * The name of the component this API object belongs to
	 */
	private readonly name: string;

	/**
	 * Component defined variable definitions
	 */
	private readonly definitions: Map<string, VariableDefinition>;
	private readonly variables: Map<string, any>;

	/**
	 * Currently existing subscriptions of this component.
	 * The key is the namespace where a subscription was added,
	 * the value is an array of subscription ids on that namespace.
	 */
	private readonly subscriptions: Map<string, string[]>;

	public constructor(bento: Bento, name: string) {
		this.bento = bento;
		this.name = name;

		this.definitions = new Map();
		this.variables = new Map();

		this.subscriptions = new Map();
	}

	public addDefinitions(definitions: VariableDefinition[]) {
		if (!Array.isArray(definitions)) throw new IllegalArgumentError('Definitions must be an array');

		for (let definition of definitions) {
			this.addDefinition(definition);
		}
	}

	public addDefinition(definition: VariableDefinition) {
		if (!definition.name) throw new Error('VariableDefinition must define a name');
		if (this.definitions.has(definition.name)) throw new Error('A VariableDefinition with this name already exists');

		this.definitions.set(definition.name, definition);

		this.processValue(definition);
	}

	public removeDefinition(name: string) {
		if (!this.definitions.has(name)) throw new Error('There is no VariableDefinition with that name loaded');

		this.definitions.delete(name);
	}

	/**
	 * Gets a variable 
	 * @param name - Variable name
	 */
	public getVariable(name: string) {
		if (!this.variables.has(name)) return null;
		return this.variables.get(name);
	}

	private processValue(definition: VariableDefinition) {
		let value = null;

		// check in bento
		if (this.bento.variables.has(definition.name)) {
			value = this.bento.variables.get(definition.name);
		}

		// if null and have default set now
		if (!value && definition.default) value = definition.default;

		// if required and still null fail now
		if (!value && definition.required) throw new Error('VariableDefinition required and unable to parse value');

		// TODO: Validator support

		this.variables.set(definition.name, value);
	}

	/**
	 * Fetch the provided primary component instance
	 *
	 * @param name - Primary component name
	 */
	public getPrimary(name: string) {
		const component = this.bento.primary.get(name);
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
		const emitter = this.bento.events.get(this.name);
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
		const emitter = this.bento.events.get(this.name);
		if (emitter == null) throw new IllegalStateError('PANIC! Something really bad has happened. Primary component emitter does not exist?');

		emitter.emit(eventName, ...args);
	}

	public subscribe(type: SubscriptionType, namespace: string, name: string, handler: (...args: any[]) => void, context?: any) {
		// Get the namespace
		const events = this.bento.events.get(namespace);
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
		const events = this.bento.events.get(namespace);
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
			const events = this.bento.events.get(namespace);
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
