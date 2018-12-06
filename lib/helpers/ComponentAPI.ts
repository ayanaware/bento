'use strict';

import { EventEmitter } from 'events';

import { IllegalArgumentError, IllegalStateError } from '@ayana/errors';
import { Logger } from '@ayana/logger';

import { Bento } from '../Bento';

import { SubscriptionType } from '../constants';
import { VariableProcessError } from '../errors';
import { Component, ComponentVariableDefinition, VariableType, VariableValidator } from '../interfaces';

/**
 * Logger instance for the ComponentAPI class
 *
 * @ignore
 */
const log = Logger.get('ComponentAPI');

/**
 * The gateway of a component to the rest of the application.
 * Each component gets one if loaded.
 */
export class ComponentAPI {
	private readonly bento: Bento;

	/**
	 * The component this API object belongs to
	 */
	private readonly component: Component;

	/**
	 * Currently existing subscriptions of this component.
	 * The key is the namespace where a subscription was added,
	 * the value is an array of subscription ids on that namespace.
	 */
	private readonly subscriptions: Map<string, string[]> = new Map();

	public constructor(bento: Bento, component: Component) {
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
	public injectVariables(definitions: ComponentVariableDefinition[]) {
		if (!Array.isArray(definitions)) throw new IllegalArgumentError('Definitions must be an array');

		for (const definition of definitions) {
			this.injectVariable(definition);
		}
	}

	/**
	 * Defines and attaches a variable to component
	 * @param definition - The definition of the variable to define
	 */
	public injectVariable(definition: ComponentVariableDefinition) {
		if (!definition.name) throw new IllegalArgumentError('A VariableDefinition must define a name');

		// if variable not in bento, and no default defined. Throw an error
		if (!this.bento.hasVariable(definition.name) && definition.default === undefined) {
			throw new IllegalStateError(`Cannot inject undefined variable "${definition.name}"`);
		}

		// attach property to component
		Object.defineProperty(this.component, definition.name, {
			configurable: true,
			enumerable: false,
			writable: false,
			get: () => {
				return this.getValue(definition);
			},
			set: function () {
				// TODO Change to IllegalAccessError
				throw new Error(`Cannot set injected variable "${definition.name}"`);
			}
		});
	}

	/**
	 * Check if bento has a variable or not
	 * @param name - name of variable
	 */
	public hasVariable(name: string) {
		return this.bento.hasVariable(name);
	}

	/**
	 * Gets the value of a variable
	 * @param definition - Variable name or definition
	 */
	public getVariable(definition: ComponentVariableDefinition | string): any {
		// if string, convert to basic definition
		if (typeof definition === 'string') {
			definition = {
				name: definition,
				type: VariableType.STRING,
			};
		}

		// validate definition
		if (!definition.name) throw new IllegalArgumentError('VariableDefinition must define a name');
		const value = this.getValue(definition);

		// if undefined. then is a required variable that is not in bento
		if (value === undefined) throw new IllegalStateError(`Failed to find a value for "${definition.name}" variable`);

		return value;
	}

	private getValue(definition: ComponentVariableDefinition) {
		let value = undefined;

		// get latest
		if (this.bento.hasVariable(definition.name)) {
			value = this.bento.getVariable(definition.name);
		}

		// if undefined and have default set now
		if (value === undefined && definition.default !== undefined) value = definition.default;
		if (value === undefined) return value;

		// Verifies that value matches definition type
		switch (definition.type) {
			case VariableType.NUMBER:
			case VariableType.STRING:
			case VariableType.BOOLEAN: {
				if (typeof value !== definition.type) throw new IllegalStateError('Found value does not match definition type');
				break;
			}

			case VariableType.ARRAY: {
				if (!Array.isArray) throw new IllegalStateError('Found value does not match definition type');
				break;
			}

			case VariableType.OBJECT: {
				if (typeof value === 'object' && Array.isArray(value)) throw new IllegalStateError('Found value does not match definition type');
				break;
			}

			default: {
				throw new IllegalStateError('VariableDefinition specified an unknown type');
				break;
			}
		}

		// TODO: validators

		return value;
	}

	/**
	 * Fetch the provided component instance
	 *
	 * @param referece - Component name or reference
	 */
	public getComponent<T extends Component>(reference: Component | string): T {
		const name = this.bento.resolveComponentName(reference);

		const component = this.bento.components.get(name);
		if (!component) return null;

		return component as T;
	}

	/**
	 * Inject component dependency into invoking component
	 * @param reference - Component name or reference
	 * @param name - name to inject into
	 */
	public injectComponent(reference: Component | string, injectName: string) {
		if (this.component.hasOwnProperty(injectName)) throw new IllegalStateError(`Component already has property "${injectName}" defined.`);

		const component = this.getComponent(reference);
		if (!component) throw new IllegalStateError('Component not found');

		Object.defineProperty(this.component, injectName, {
			configurable: false,
			enumerable: true,
			writable: false,
			value: component,
		});
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
		if (emitter == null) throw new IllegalStateError('PANIC! Something really bad has happened. Component emitter does not exist?');

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
		if (emitter == null) throw new IllegalStateError('PANIC! Something really bad has happened. Component emitter does not exist?');

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
	public subscribe(type: SubscriptionType, namespace: Component | string, name: string, handler: (...args: any[]) => void, context?: any) {
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
	public subscribeEvent(namespace: Component | string, eventName: string, handler: (...args: any[]) => void, context?: any) {
		return this.subscribe(SubscriptionType.EVENT, namespace, eventName, handler, context);
	}

	/**
	 * Alias for subscribe with subject
	 * @param namespace - Component Reference / Name
	 * @param eventName - Name of the event
	 * @param handler - The function to be called
	 * @param context - Optional `this` context for above handler function
	 */
	public subscribeSubject(namespace: Component | string, subjectName: string, handler: (...args: any[]) => void, context?: any) {
		return this.subscribe(SubscriptionType.SUBJECT, namespace, subjectName, handler, context);
	}

	/**
	 * Ubsubscribe from a Component Event
	 * @param namespace - Component Reference / Name
	 * @param subID - subscription id provided by subscribe
	 */
	public unsubscribe(namespace: Component | string, subID: string) {
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
	public unsubscribeAll(namespace?: Component | string) {
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
