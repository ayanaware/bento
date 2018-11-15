'use strict';

import { EventEmitter } from 'events';

import { IllegalArgumentError, IllegalStateError } from '@ayana/errors';
import { Logger } from '@ayana/logger';

import { Bento } from '../Bento';

import { SubscriptionType } from '../constants';
import { VariableProcessError } from '../errors';
import { PrimaryComponent, SecondaryComponent, VariableDefinition } from '../interfaces';

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
	 * The component this API object belongs to
	 */
	private readonly component: PrimaryComponent | SecondaryComponent;

	/**
	 * Component defined variable definitions
	 */
	private readonly definitions: Map<string, VariableDefinition> = new Map();

	/**
	 * Currently existing subscriptions of this component.
	 * The key is the namespace where a subscription was added,
	 * the value is an array of subscription ids on that namespace.
	 */
	private readonly subscriptions: Map<string, string[]> = new Map();

	public constructor(bento: Bento, component: PrimaryComponent | SecondaryComponent) {
		this.bento = bento;
		this.component = component;
	}

	/**
	 * Fetch the value of given application property
	 * @param name - name of application property
	 */
	public getProperty(name: string) {
		return this.bento.getProperty(name);
	}

	/**
	 * Define multiple variables at once
	 * @param definitions - Array of definitions
	 */
	public defineVariables(definitions: VariableDefinition[]) {
		if (!Array.isArray(definitions)) throw new IllegalArgumentError('Definitions must be an array');

		for (const definition of definitions) {
			this.defineVariable(definition);
		}
	}

	/**
	 * Defines and attaches a variable to component
	 * @param definition - The definition of the variable to define
	 */
	public defineVariable(definition: VariableDefinition) {
		if (!definition.type) throw new IllegalArgumentError('VariableDefinition must define a type');
		if (!definition.name) throw new IllegalArgumentError('VariableDefinition must define a name');

		if (this.definitions.has(definition.name)) throw new IllegalStateError('A VariableDefinition with this name is already defined');

		// if no default, and undefined throw an error
		if (!this.bento.hasVariable(definition.name) && definition.default === undefined) {
			throw new IllegalStateError(`Can not attach variable "${definition.name}", not in Bento, and no default`);
		}

		// attach property to component
		Object.defineProperty(this.component, definition.name, {
			configurable: true,
			enumerable: false,
			get: () => {
				return this.processValue(definition);
			},
			set: function () {
				// TODO Change to IllegalAccessError
				throw new Error(`Cannot set Bento variable "${definition.name}" on Component "${this.component.name}"`);
			}
		});

		this.definitions.set(definition.name, definition);
	}

	/**
	 * Undefines and detaches a variable from component
	 * @param name - Name of variable to remove
	 */
	public undefineVariable(name: string) {
		if (typeof name !== 'string') throw new IllegalArgumentError('name must be a string');
		if (!this.definitions.has(name)) throw new IllegalStateError('There is no VariableDefinition with that name defined');

		if (this.component.hasOwnProperty(name)) delete (this.component as any)[name];

		this.definitions.delete(name);
	}

	/**
	 * Check if bento has a variable loaded
	 * @param name - name of variable to check
	 */
	public hasVariable(name: string) {
		return this.bento.hasVariable(name);
	}

	/**
	 * Gets the value of a variable
	 * @param name - Variable name
	 */
	public getVariable(name: string): any {
		// check if we have the variable defined in definitions, if so use processValue
		if (this.definitions.has(name)) return this.processValue(this.definitions.get(name));

		// else pull directly from Bento
		if (!this.hasVariable(name)) throw new IllegalStateError(`Variable "${name}" does not exist in Bento`);
		return this.bento.getVariable(name);
	}

	private processValue(definition: VariableDefinition) {
		let value = undefined;

		// get latest
		if (this.bento.hasVariable(definition.name)) {
			value = this.bento.getVariable(definition.name);
		}

		// if undefined and have default set now
		if (value === undefined && definition.default !== undefined) value = definition.default;

		// TODO: validators

		return value;
	}

	/**
	 * Fetch the provided primary component instance
	 *
	 * @param name - Primary component name
	 */
	public getPrimary<T extends PrimaryComponent>(reference: PrimaryComponent | string): T {
		const name = this.bento.resolveComponentName(reference);

		const component = this.bento.primary.get(name);
		if (!component) return null;

		return component as T;
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
		const emitter = this.bento.events.get(this.component.name);
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

	/**
	 * Emit a event on Component Events
	 * @param eventName - Name of event
	 * @param args - Ordered Array of args to emit
	 */
	public async emit(eventName: string, ...args: any[]) {
		const emitter = this.bento.events.get(this.component.name);
		if (emitter == null) throw new IllegalStateError('PANIC! Something really bad has happened. Primary component emitter does not exist?');

		emitter.emit(eventName, ...args);
	}

	/**
	 * Subscribe to a Component event
	 * @param type - Type of subscription. Normal event or Subject
	 * @param namespace - Component Reference / Name
	 * @param name - Name of the event
	 * @param handler - The function to be called
	 * @param context - Optional `this` context for above handler function
	 */
	public subscribe(type: SubscriptionType, namespace: PrimaryComponent | string, name: string, handler: (...args: any[]) => void, context?: any) {
		const componentName = this.bento.resolveComponentName(namespace);

		// Get the namespace
		const events = this.bento.events.get(componentName);
		if (events == null) throw new IllegalArgumentError(`Component Events "${componentName}" does not exist`);

		const subID = events.subscribe(type, name, handler, context);

		// Register subscription so if the current component unloads we can remove all events
		// TODO If the componentName component unloads we need to remove that array
		if (!this.subscriptions.has(componentName)) this.subscriptions.set(componentName, []);
		this.subscriptions.get(componentName).push(subID);

		return subID;
	}

	/**
	 * Alias for subscribe with normal event
	 * @param namespace - Component Reference / Name
	 * @param eventName - Name of the event
	 * @param handler - The function to be called
	 * @param context - Optional `this` context for above handler function
	 */
	public subscribeEvent(namespace: PrimaryComponent | string, eventName: string, handler: (...args: any[]) => void, context?: any) {
		return this.subscribe(SubscriptionType.EVENT, namespace, eventName, handler, context);
	}

	/**
	 * Alias for subscribe with subject
	 * @param namespace - Component Reference / Name
	 * @param eventName - Name of the event
	 * @param handler - The function to be called
	 * @param context - Optional `this` context for above handler function
	 */
	public subscribeSubject(namespace: PrimaryComponent | string, subjectName: string, handler: (...args: any[]) => void, context?: any) {
		return this.subscribe(SubscriptionType.SUBJECT, namespace, subjectName, handler, context);
	}

	/**
	 * Ubsubscribe from a Component Event
	 * @param namespace - Component Reference / Name
	 * @param subID - subscription id provided by subscribe
	 */
	public unsubscribe(namespace: PrimaryComponent | string, subID: string) {
		const componentName = this.bento.resolveComponentName(namespace);

		// Check if the component events exists
		const events = this.bento.events.get(componentName);
		if (events == null) {
			log.warn(`Could not find events for namespace "${componentName}" while trying to unsubscribe`, this.component.name);
			return;
		}

		// Check if this subscriber actually exists
		const subscriber = this.subscriptions.get(componentName);
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
	public unsubscribeAll(namespace?: PrimaryComponent | string) {
		if (namespace != null) {
			const componentName = this.bento.resolveComponentName(namespace);
			// Get the namespace events
			const events = this.bento.events.get(componentName);
			if (events == null) {
				log.warn(`Could not find events for namespace "${componentName}" while trying to unsubscribe`, this.component.name);
				return;
			}

			// Get subscriptions on that namespace
			const subscriptions = this.subscriptions.get(componentName);
			// No subscriptions on that namespace exist
			if (subscriptions == null) return;

			// Unsubscribe from all events
			for (const subID of subscriptions) {
				events.unsubscribe(subID);
			}

			// Remove array
			this.subscriptions.delete(componentName);
		} else {
			// No namespace was given so we unsubscribe everything
			for (const ns of this.subscriptions.keys()) {
				this.unsubscribeAll(ns);
			}
		}
	}
}
