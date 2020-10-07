
import { IllegalAccessError, IllegalArgumentError, IllegalStateError } from '@ayanaware/errors';

import { Bento } from '../../Bento';
import { EventEmitterLike } from '../../interfaces';
import { VariableDefinition } from '../../variables';
import { Component, Plugin } from '../interfaces';
import { ComponentReference, EntityReference, PluginReference } from '../references';

/**
 * Shared functions for ComponentAPI and PluginAPI
 */
export class SharedAPI {
	protected readonly bento: Bento;

	/**
	 * Owner entity of this API instance
	 */
	protected entity: Plugin | Component;

	/**
	 * Currently existing subscriptions of this component.
	 * The key is the namespace where a subscription was added,
	 * the value is an array of subscription ids on that namespace.
	 */
	private readonly subscriptions: Map<string, Array<number>> = new Map();

	public constructor(bento: Bento) {
		this.bento = bento;
	}

	/**
	 * Get the semantic version string of the bento instance attached to this component api
	 * @returns Semantic version string (https://semver.org)
	 */
	public getBentoVersion() {
		return this.bento.version;
	}

	/**
	 * Check if bento has a given property
	 * @param name name of property
	 *
	 * @returns boolean
	 */
	public hasProperty(name: string) {
		return this.bento.properties.hasProperty(name);
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
			};
		}

		// validate definition
		if (!definition.name) throw new IllegalArgumentError('VariableDefinition must define a name');

		const value = this.bento.variables.getVariable<T>(definition.name, definition.default);

		// if undefined. then is a required variable that is not in bento
		if (value === undefined) throw new IllegalStateError(`Failed to find a value for "${definition.name}" variable`);

		return value;
	}

	/**
	 * Check if Bento has a given plugin
	 *
	 * @param reference Plugin instance, name or reference
	 *
	 * @returns boolean
	 */
	public hasPlugin(reference: PluginReference) {
		return this.bento.entities.hasPlugin(reference);
	}

	/**
	 * Fetch the provided plugin instance
	 *
	 * @param reference Plugin name or reference
	 *
	 * @returns Plugin instance
	 */
	public getPlugin<T extends Plugin>(reference: PluginReference): T {
		const name = this.bento.entities.resolveName(reference);
		const plugin = this.bento.entities.getPlugin<T>(name);
		if (!plugin) throw new IllegalStateError(`Plugin "${name}" does not exist`);

		return plugin;
	}

	/**
	 * Checks if Bento has a given component
	 *
	 * @param reference Component instance, name or reference
	 *
	 * @returns boolean
	 */
	public hasComponent(reference: ComponentReference) {
		return this.bento.entities.hasComponent(reference);
	}

	/**
	 * Fetch the provided component instance
	 *
	 * @param reference Component name or reference
	 *
	 * @returns Component instance
	 */
	public getComponent<T extends Component>(reference: ComponentReference): T {
		const name = this.bento.entities.resolveName(reference);
		const component = this.bento.entities.getComponent<T>(name);
		if (!component) throw new IllegalStateError(`Component "${name}" does not exist`);

		return component;
	}

	/**
	 * Inject component dependency into invoking entity
	 * @param reference Component name or reference
	 * @param injectName property name to inject into
	 */
	public injectComponent(reference: ComponentReference, injectName: string) {
		if (this.entity.hasOwnProperty(injectName)) throw new IllegalStateError(`Entity already has property "${injectName}" defined.`);
		if (!this.hasComponent(reference)) throw new IllegalStateError('Unable to inject non-existent component');

		Object.defineProperty(this.entity, injectName, {
			configurable: true,
			enumerable: true,
			get: () => this.getComponent(reference),
			set: () => {
				throw new IllegalAccessError(`Cannot write to injected component`);
			},
		});
	}

	/**
	 * Inject plugin into invoking entity
	 * @param reference Plugin name or reference
	 * @param injectName property name to inject into
	 */
	public injectPlugin(reference: PluginReference, injectName: string) {
		if (this.entity.hasOwnProperty(injectName)) throw new IllegalStateError(`Entity already has property "${injectName}" defined.`);
		if (!this.hasPlugin(reference)) throw new IllegalStateError('Unable to inject non-existent plugin');

		Object.defineProperty(this.entity, injectName, {
			configurable: true,
			enumerable: true,
			get: () => this.getPlugin(reference),
			set: () => {
				throw new IllegalAccessError(`Cannot write to injected plugin`);
			},
		});
	}

	/**
	 * Inject an entity into invoking entity
	 * @param reference Entity name or reference
	 * @param injectName Property name to inject to
	 */
	public injectEntity(reference: EntityReference, injectName: string) {
		if (this.entity.hasOwnProperty(injectName)) throw new IllegalStateError(`Entity already has property "${injectName}" defined.`);

		const name = this.bento.entities.resolveName(reference);

		if (this.hasPlugin(name)) this.injectPlugin(name, injectName);
		else if (this.hasComponent(name)) this.injectComponent(name, injectName);
		else throw new IllegalStateError('Unable to inject non-existent entity');
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
		Object.defineProperty(this.entity, property, {
			configurable: true,
			enumerable: false,
			get: () => this.getVariable(definition),
			set: () => {
				throw new IllegalAccessError(`Cannot write to injected variable`);
			},
		});
	}

	/**
	 * Emit a event on Bento Events
	 * @param eventName Name of event
	 * @param args Ordered Array of args to emit
	 */
	public emit(eventName: string, ...args: Array<any>) {
		const emitter = this.bento.entities.getEvents(this.entity.name);
		emitter.emit(eventName, ...args);
	}

	/**
	 * Emit subject event on Bento Events
	 * @param eventName Name of event
	 * @param args Ordered Array of args to emit
	 */
	public emitSubject(eventName: string, ...args: Array<any>) {
		const emitter = this.bento.entities.getEvents(this.entity.name);
		emitter.emitSubject(eventName, ...args);
	}

	// TODO: Add a error handler
	/**
	 * Re-emits events from a standard event emitter into Bento events.
	 *
	 * @param fromEmitter Emitter to re-emit from
	 * @param events Events to watch for
	 *
	 * @throws IllegalArgumentError if fromEmitter is not an EventEmitter or events is not an array
	 */
	public forwardEvents(fromEmitter: EventEmitterLike, events: Array<string>) {
		if (events != null && !Array.isArray(events)) throw new IllegalArgumentError('events is not an array');

		const emitter = this.bento.entities.getEvents(this.entity.name);
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
	 * Subscribe to Bento events
	 * @param reference Entity Reference / Name
	 * @param name Name of the event
	 * @param handler The function to be called
	 * @param context Optional `this` context for prior handler function
	 *
	 * @returns Subscription ID
	 */
	// tslint:disable-next-line:max-params
	public subscribe(reference: EntityReference, name: string, handler: (...args: Array<any>) => void, context?: any) {
		const entityName = this.bento.entities.resolveName(reference);

		// Get the namespace
		const events = this.bento.entities.getEvents(entityName);
		const id = events.subscribe(name, handler, context);

		// Register subscription so if the current component unloads we can remove all events
		// TODO: If the componentName component unloads we need to remove that array
		if (!this.subscriptions.has(entityName)) this.subscriptions.set(entityName, []);
		this.subscriptions.get(entityName).push(id);

		return id;
	}

	/**
	 * Alias for subscribe with normal event
	 * @param reference Entity Reference / Name
	 * @param eventName Name of the event
	 * @param handler The function to be called
	 * @param context Optional `this` context for above handler function
	 *
	 * @deprecated
	 *
	 * @returns Subscription ID
	 */
	public subscribeEvent(reference: EntityReference, eventName: string, handler: (...args: Array<any>) => void, context?: any) {
		return this.subscribe(reference, eventName, handler, context);
	}

	/**
	 * Ubsubscribe from a Component Event
	 * @param reference - Component Reference / Name
	 * @param id - subscription id provided by subscribe
	 */
	public unsubscribe(reference: EntityReference, id: number) {
		const entityName = this.bento.entities.resolveName(reference);

		// Check if the component events exists
		const events = this.bento.entities.getEvents(entityName);
		if (events == null) return;

		// Check if this subscriber actually exists
		const subscriber = this.subscriptions.get(entityName);
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
	public unsubscribeAll(reference?: EntityReference) {
		if (reference != null) {
			const entityName = this.bento.entities.resolveName(reference);

			if (!this.bento.entities.hasEvents(entityName)) return;
			const events = this.bento.entities.getEvents(entityName);

			// Get subscriptions on that component
			const subscriptions = this.subscriptions.get(entityName);
			if (subscriptions == null) return;

			// Unsubscribe from all events
			for (const subID of subscriptions) {
				events.unsubscribe(subID);
			}

			// Remove array
			this.subscriptions.delete(entityName);
		} else {
			// No componentName was given so we unsubscribe everything
			for (const ns of this.subscriptions.keys()) {
				this.unsubscribeAll(ns);
			}
		}
	}
}
