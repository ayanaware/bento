'use strict';

import { IllegalArgumentError, IllegalStateError } from '@ayana/errors';
import { IllegalAccessError } from '../errors/IllegalAccessError';

import { Bento } from '../Bento';
import { ComponentReference, PluginReference } from '../references';

import { Component } from './interfaces';

import { Plugin } from '../plugins';

import {
	EventEmitterLike,
	VariableDefinition,
	VariableDefinitionType,
} from '../interfaces';

import { SubscriptionType } from './SubscriptionType';

import { Logger } from '@ayana/logger-api';
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
	 * Get the semantic version string of the bento instance attached to this component api
	 * @returns Semantic version string (https://semver.org)
	 */
	public getBentoVersion() {
		return this.bento.version;
	}

	/**
	 * Checks if Bento has a given component
	 *
	 * @param reference Component instance, name or reference
	 *
	 * @returns boolean
	 */
	public hasComponent(reference: ComponentReference) {
		return this.bento.components.hasComponent(reference);
	}

	/**
	 * Fetch the provided component instance
	 *
	 * @param reference Component name or reference
	 *
	 * @returns Component instance
	 */
	public getComponent<T extends Component>(reference: ComponentReference): T {
		const name = this.bento.components.resolveName(reference);
		const component = this.bento.components.getComponent<T>(name);
		if (!component) throw new IllegalStateError(`Component "${name}" does not exist`);

		return component;
	}

	/**
	 * Inject component dependency into invoking component
	 * @param reference Component name or reference
	 * @param injectName name to inject into
	 */
	public injectComponent(reference: ComponentReference, injectName: string) {
		if (this.component.hasOwnProperty(injectName)) throw new IllegalStateError(`Component already has property "${injectName}" defined.`);
		if (this.hasComponent(reference) === false) throw new IllegalStateError('Unable to inject non-existent component');

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
	 * Checks if Bento has a given plugin
	 *
	 * @param reference Plugin instance, name or reference
	 *
	 * @returns boolean
	 */
	public hasPlugin(reference: PluginReference) {
		return this.bento.plugins.hasPlugin(reference);
	}

	/**
	 * Fetch the provided plugin instance
	 *
	 * @param reference Plugin name or reference
	 *
	 * @returns Plugin instance
	 */
	public getPlugin<T extends Plugin>(reference: PluginReference): T {
		const name = this.bento.plugins.resolveName(reference);
		const plugin = this.bento.plugins.getPlugin<T>(name);
		if (!plugin) throw new IllegalStateError(`Plugin "${name}" does not exist`);

		return plugin;
	}

	/**
	 * Inject plugin into invoking component
	 * @param reference Plugin name or reference
	 * @param injectName name to inject into
	 */
	public injectPlugin(reference: PluginReference, injectName: string) {
		if (this.component.hasOwnProperty(injectName)) throw new IllegalStateError(`Component already has property "${injectName}" defined.`);
		if (this.hasPlugin(reference) === false) throw new IllegalStateError('Unable to inject non-existent plugin');

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
	 * Fetch the value of given application property
	 * @param name name of application property
	 *
	 * @returns Property value
	 */
	public getProperty(name: string) {
		return this.bento.getProperty(name);
	}

	/**
	 * Check if bento has a given variable
	 * @param name name of variable
	 *
	 * @returns boolean
	 */
	public hasVariable(name: string) {
		return this.bento.variables.hasVariable(name);
	}

	/**
	 * Gets the value of a variable
	 * @param definition Variable name or definition
	 *
	 * @returns Variable value
	 */
	public getVariable<T>(definition: VariableDefinition | string): T {
		// if string, convert to basic definition
		if (typeof definition === 'string') {
			definition = {
				name: definition,
				type: VariableDefinitionType.STRING,
			};
		}

		if (!definition.type) definition.type = VariableDefinitionType.STRING;

		// validate definition
		if (!definition.name) throw new IllegalArgumentError('VariableDefinition must define a name');

		const value = this.bento.variables.getVariable<T>(definition.name, definition.default);
		// if undefined. then is a required variable that is not in bento
		if (value === undefined) throw new IllegalStateError(`Failed to find a value for "${definition.name}" variable`);

		return value;
	}

	/**
	 * Defines and attaches a variable to component
	 * @param definition Variable definition
	 */
	public injectVariable(definition: VariableDefinition) {
		if (!definition.name) throw new IllegalArgumentError('A VariableDefinition must define a name');
		if (!definition.type) definition.type = VariableDefinitionType.STRING;

		// if variable not in bento, and no default defined. Throw an error
		if (!this.hasVariable(definition.name) && definition.default === undefined) {
			throw new IllegalStateError(`Cannot inject undefined variable "${definition.name}"`);
		}

		// attach property to component
		Object.defineProperty(this.component, definition.property || definition.name, {
			configurable: true,
			enumerable: false,
			get: () => this.getVariable(definition),
			set: () => {
				throw new IllegalAccessError(`Cannot write to injected variable`);
			},
		});
	}

	/**
	 * Define multiple variables at once
	 * @param definitions Array of definitions
	 */
	public injectVariables(definitions: VariableDefinition[]) {
		if (!Array.isArray(definitions)) throw new IllegalArgumentError('Definitions must be an array');

		for (const definition of definitions) {
			this.injectVariable(definition);
		}
	}

	/**
	 * Emit a event on Component Events
	 * @param eventName Name of event
	 * @param args Ordered Array of args to emit
	 */
	public async emit(eventName: string, ...args: any[]) {
		const emitter = this.bento.components.getComponentEvents(this.component.name);
		if (emitter == null) throw new IllegalStateError('PANIC! Something really bad has happened. Component emitter does not exist?');

		emitter.emit(eventName, ...args);
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
	public forwardEvents(fromEmitter: EventEmitterLike, events: string[]) {
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
	 * @param type Type of subscription. Normal event or Subject
	 * @param reference Component Reference / Name
	 * @param name Name of the event
	 * @param handler The function to be called
	 * @param context Optional `this` context for above handler function
	 *
	 * @returns Subscription ID
	 */
	// tslint:disable-next-line:max-params
	public subscribe(type: SubscriptionType, reference: ComponentReference, name: string, handler: (...args: any[]) => void, context?: any) {
		const componentName = this.bento.components.resolveName(reference);

		// Get the namespace
		const events = this.bento.components.getComponentEvents(componentName);
		if (events == null) throw new IllegalArgumentError(`Component Events "${componentName}" does not exist`);

		const subID = events.subscribe(type, name, handler, context);

		// Register subscription so if the current component unloads we can remove all events
		// TODO: If the componentName component unloads we need to remove that array
		if (!this.subscriptions.has(componentName)) this.subscriptions.set(componentName, []);
		this.subscriptions.get(componentName).push(subID);

		return subID;
	}

	/**
	 * Alias for subscribe with normal event
	 * @param reference Component Reference / Name
	 * @param eventName Name of the event
	 * @param handler The function to be called
	 * @param context Optional `this` context for above handler function
	 *
	 * @returns Subscription ID
	 */
	public subscribeEvent(reference: ComponentReference, eventName: string, handler: (...args: any[]) => void, context?: any) {
		return this.subscribe(SubscriptionType.EVENT, reference, eventName, handler, context);
	}

	/**
	 * Alias for subscribe with subject
	 * @param reference Component Reference / Name
	 * @param subjectName Name of the event
	 * @param handler The function to be called
	 * @param context Optional `this` context for above handler function
	 *
	 * @returns Subscription ID
	 */
	public subscribeSubject(reference: ComponentReference, subjectName: string, handler: (...args: any[]) => void, context?: any) {
		return this.subscribe(SubscriptionType.SUBJECT, reference, subjectName, handler, context);
	}

	/**
	 * Ubsubscribe from a Component Event
	 * @param reference - Component Reference / Name
	 * @param subID - subscription id provided by subscribe
	 */
	public unsubscribe(reference: ComponentReference, subID: string) {
		const componentName = this.bento.components.resolveName(reference);

		// Check if the component events exists
		const events = this.bento.components.getComponentEvents(componentName);
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
