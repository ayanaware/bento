
import {
	IllegalAccessError,
	IllegalArgumentError,
	IllegalStateError,
} from '@ayana/errors';
import { Logger } from '@ayana/logger-api';

import { SharedAPI } from '../abstractions';
import { Bento } from '../Bento';
import { EventEmitterLike } from '../interfaces';
import { ComponentReference, PluginReference } from '../references';
import { VariableDefinition } from '../variables';

import { Component } from './interfaces';
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
export class ComponentAPI extends SharedAPI {
	/**
	 * The component this API object belongs to
	 */
	private readonly component: Component;

	/**
	 * Currently existing subscriptions of this component.
	 * The key is the namespace where a subscription was added,
	 * the value is an array of subscription ids on that namespace.
	 */
	private readonly subscriptions: Map<string, Array<number>> = new Map();

	public constructor(bento: Bento, component: Component) {
		super(bento);

		this.component = component;
	}

	/**
	 * Inject component dependency into invoking component
	 * @param reference Component name or reference
	 * @param injectName property name to inject into
	 */
	public injectComponent(reference: ComponentReference, injectName: string) {
		if (this.component.hasOwnProperty(injectName)) throw new IllegalStateError(`Component already has property "${injectName}" defined.`);
		if (!this.hasComponent(reference)) throw new IllegalStateError('Unable to inject non-existent component');

		Object.defineProperty(this.component, injectName, {
			configurable: true,
			enumerable: true,
			get: () => this.getComponent(reference),
			set: () => {
				throw new IllegalAccessError(`Cannot write to injected component`);
			},
		});
	}

	/**
	 * Invokes a plugins loadComponents method. Allowing for easy loading of peer/children components
	 * @param reference Plugin name or reference
	 * @param args Arguments to be passed to Plugin.loadComponents() method
	 *
	 * @returns Plugin.loadComponents() result
	 */
	public async loadComponents(reference: PluginReference, ...args: Array<any>) {
		if (reference == null) throw new IllegalArgumentError('Pluginreference must be defined');

		// verify that the plugin exists in bento
		let plugin = null;
		try {
			plugin = this.getPlugin<any>(reference);
		} catch (e) {
			throw new IllegalStateError(`Failed to find requested component`).setCause(e);
		}

		if (typeof plugin.loadComponents !== 'function') throw new IllegalStateError(`Plugin "${plugin.name}" does not define loadComponents method`);

		return plugin.loadComponents(...args);
	}

	/**
	 * Inject plugin into invoking component
	 * @param reference Plugin name or reference
	 * @param injectName property name to inject into
	 */
	public injectPlugin(reference: PluginReference, injectName: string) {
		if (this.component.hasOwnProperty(injectName)) throw new IllegalStateError(`Component already has property "${injectName}" defined.`);
		if (!this.hasPlugin(reference)) throw new IllegalStateError('Unable to inject non-existent plugin');

		Object.defineProperty(this.component, injectName, {
			configurable: true,
			enumerable: true,
			get: () => this.getPlugin(reference),
			set: () => {
				throw new IllegalAccessError(`Cannot write to injected plugin`);
			},
		});
	}

	/**
	 * Defines and attaches a variable to component
	 * @param definition Variable definition
	 * @param injectName property name to inject into
	 */
	public injectVariable(definition: VariableDefinition, injectName?: string) {
		if (!definition.name) throw new IllegalArgumentError('A VariableDefinition must define a name');

		// if variable not in bento, and no default defined. Throw an error
		if (!this.hasVariable(definition.name) && definition.default === undefined) {
			throw new IllegalStateError(`Cannot inject undefined variable "${definition.name}"`);
		}

		const property = injectName || definition.name;

		// attach property to component
		Object.defineProperty(this.component, property, {
			configurable: true,
			enumerable: false,
			get: () => this.getVariable(definition),
			set: () => {
				throw new IllegalAccessError(`Cannot write to injected variable`);
			},
		});
	}

	/**
	 * Emit a event on Component Events
	 * @param eventName Name of event
	 * @param args Ordered Array of args to emit
	 */
	public async emit(eventName: string, ...args: Array<any>) {
		const emitter = this.bento.components.getComponentEvents(this.component.name);
		if (emitter == null) throw new IllegalStateError('PANIC! Something really bad has happened. Component emitter does not exist?');

		emitter.emit(eventName, ...args);
	}

	/**
	 * Emit subject event on Component Events
	 * @param eventName Name of event
	 * @param args Ordered Array of args to emit
	 */
	public async emitSubject(eventName: string, ...args: Array<any>) {
		const emitter = this.bento.components.getComponentEvents(this.component.name);
		if (emitter == null) throw new IllegalStateError('PANIC! Something really bad has happened. Component emitter does not exist?');

		emitter.emitSubject(eventName, ...args);
	}

	// TODO: Add a error handler
	/**
	 * Re-emits events from a standard event emitter into component events.
	 *
	 * @param fromEmitter Emitter to re-emit from
	 * @param events Events to watch for
	 *
	 * @throws IllegalStateError if the emitter on the current component wasn't initialized
	 * @throws IllegalArgumentError if fromEmitter is not an EventEmitter or events is not an array
	 */
	public forwardEvents(fromEmitter: EventEmitterLike, events: Array<string>) {
		const emitter = this.bento.components.getComponentEvents(this.component.name);
		if (emitter == null) throw new IllegalStateError('PANIC! Something really bad has happened. Component emitter does not exist?');

		if (events != null && !Array.isArray(events)) {
			throw new IllegalArgumentError('events is not an array');
		}

		events.forEach(event => {
			fromEmitter.addListener(event, (...args) => {
				try {
					emitter.emit(event, ...args);
				} catch (e) {
					// TODO call error handler
				}
			});
		});
	}

	/**
	 * Subscribe to a Component event
	 * @param reference Component Reference / Name
	 * @param name Name of the event
	 * @param handler The function to be called
	 * @param context Optional `this` context for prior handler function
	 *
	 * @returns Subscription ID
	 */
	// tslint:disable-next-line:max-params
	public subscribe(reference: ComponentReference, name: string, handler: (...args: Array<any>) => void, context?: any) {
		const componentName = this.bento.components.resolveName(reference);

		// Get the namespace
		const events = this.bento.components.getComponentEvents(componentName);
		if (events == null) throw new IllegalArgumentError(`Component Events "${componentName}" does not exist`);

		const id = events.subscribe(name, handler, context);

		// Register subscription so if the current component unloads we can remove all events
		// TODO: If the componentName component unloads we need to remove that array
		if (!this.subscriptions.has(componentName)) this.subscriptions.set(componentName, []);
		this.subscriptions.get(componentName).push(id);

		return id;
	}

	/**
	 * Alias for subscribe with normal event
	 * @param reference Component Reference / Name
	 * @param eventName Name of the event
	 * @param handler The function to be called
	 * @param context Optional `this` context for above handler function
	 *
	 * @deprecated
	 *
	 * @returns Subscription ID
	 */
	public subscribeEvent(reference: ComponentReference, eventName: string, handler: (...args: Array<any>) => void, context?: any) {
		return this.subscribe(reference, eventName, handler, context);
	}

	/**
	 * Ubsubscribe from a Component Event
	 * @param reference - Component Reference / Name
	 * @param id - subscription id provided by subscribe
	 */
	public unsubscribe(reference: ComponentReference, id: number) {
		const componentName = this.bento.components.resolveName(reference);

		// Check if the component events exists
		const events = this.bento.components.getComponentEvents(componentName);
		if (events == null) {
			log.warn(`Could not find events for namespace "${componentName}" while trying to unsubscribe`, this.component.name);

			return;
		}

		// Check if this subscriber actually exists
		const subscriber = this.subscriptions.get(componentName);
		if (subscriber == null || !subscriber.includes(id)) throw new IllegalArgumentError(`Tried to unsubscribe from unknown id "${id}"`);

		// Unsubscribe
		events.unsubscribe(id);

		// Remove subID
		subscriber.splice(subscriber.indexOf(id), 1);
	}

	/**
	 * Unsubscribes from all events in a namespace or all events alltogether.
	 * This will automatically get called when your component gets unloaded
	 *
	 * @param reference - Optional. A namespace where all events should be unsubscribed
	 */
	public unsubscribeAll(reference?: ComponentReference) {
		if (reference != null) {
			const name = this.bento.components.resolveName(reference);
			// Get the namespace events
			const events = this.bento.components.getComponentEvents(name);
			if (events == null) {
				log.warn(`Could not find events for namespace "${name}" while trying to unsubscribe`, this.component.name);

				return;
			}

			// Get subscriptions on that namespace
			const subscriptions = this.subscriptions.get(name);
			// No subscriptions on that namespace exist
			if (subscriptions == null) return;

			// Unsubscribe from all events
			for (const subID of subscriptions) {
				events.unsubscribe(subID);
			}

			// Remove array
			this.subscriptions.delete(name);
		} else {
			// No namespace was given so we unsubscribe everything
			for (const ns of this.subscriptions.keys()) {
				this.unsubscribeAll(ns);
			}
		}
	}
}
