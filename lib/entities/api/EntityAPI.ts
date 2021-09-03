import { IllegalAccessError, IllegalArgumentError } from '@ayanaware/errors';

import type { Bento } from '../../Bento';
import { ApiError } from '../../errors/ApiError';
import { EventEmitterLike } from '../../interfaces/EventEmitterLike';
import { VariableDefinition } from '../../variables/interfaces/VariableDefinition';
import type { Component } from '../interfaces/Component';
import { Entity, EntityType } from '../interfaces/Entity';
import type { Plugin } from '../interfaces/Plugin';
import { ComponentReference } from '../types/ComponentReference';
import { EntityReference } from '../types/EntityReference';
import { PluginReference } from '../types/PluginReference';

/**
 * Shared functions for ComponentAPI and PluginAPI
 */
export class EntityAPI {
	protected readonly bento: Bento;

	/**
	 * Owner entity of this API instance
	 */
	protected entity: Entity;

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
	public getBentoVersion(): string {
		return this.bento.version;
	}

	/**
	 * Check if bento has a given property
	 * @param name name of property
	 *
	 * @returns boolean
	 */
	public hasProperty(name: string): boolean {
		return this.bento.properties.hasProperty(name);
	}

	/**
	 * Fetch the value of given application property
	 * @param name name of application property
	 *
	 * @returns Property value
	 */
	public getProperty<T>(name: string): T {
		return this.bento.properties.getProperty<T>(name);
	}

	/**
	 * Check if bento has a given variable
	 * @param name name of variable
	 *
	 * @returns boolean
	 */
	public hasVariable(name: string): boolean {
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
		if (!definition.name) throw new ApiError(this.entity, 'VariableDefinition must define a name');

		const value = this.bento.variables.getVariable<T>(definition.name, definition.default);

		// if undefined. then is a required variable that is not in bento
		if (value === undefined) throw new ApiError(this.entity, `No value available for "${definition.name}" variable`);

		return value;
	}

	/**
	 * Check if Entity exists
	 * @param reference EntityReference
	 *
	 * @returns boolean
	 */
	public hasEntity(reference: EntityReference): boolean {
		return this.bento.entities.hasEntity(reference);
	}

	/**
	 * Get Entity
	 * @param reference EntityReference
	 *
	 * @returns Entity
	 */
	public getEntity<T extends Entity>(reference: EntityReference<T>): T {
		const name = this.bento.entities.resolveReference(reference);
		const entity = this.bento.entities.getEntity<T>(name);
		if (!entity) throw new ApiError(this.entity, `Entity "${name}" does not exist`);

		return entity;
	}

	/**
	 * Check if Plugin exists
	 * @param reference PluginReference
	 *
	 * @returns boolean
	 */
	public hasPlugin(reference: PluginReference): boolean {
		return this.bento.entities.hasPlugin(reference);
	}

	/**
	 * Get Plugin
	 * @param reference PluginReference
	 *
	 * @returns Plugin
	 */
	public getPlugin<T extends Plugin>(reference: PluginReference<T>): T {
		const name = this.bento.entities.resolveReference(reference);
		const plugin = this.bento.entities.getPlugin<T>(name);
		if (!plugin) throw new ApiError(this.entity, `Plugin "${name}" does not exist`);

		return plugin;
	}

	/**
	 * Check if Component exists
	 * @param reference ComponentReference
	 *
	 * @returns boolean
	 */
	public hasComponent(reference: ComponentReference): boolean {
		return this.bento.entities.hasComponent(reference);
	}

	/**
	 * Get Component
	 * @param reference ComponentReference
	 *
	 * @returns Component
	 */
	public getComponent<T extends Component>(reference: ComponentReference<T>): T {
		const name = this.bento.entities.resolveReference(reference);
		const component = this.bento.entities.getComponent<T>(name);
		if (!component) throw new ApiError(this.entity, `Component "${name}" does not exist`);

		return component;
	}

	/**
	 * Check Plugin Depend on Component
	 * @param reference EntityReference
	 *
	 * @throws APIError if this.entity is plugin and reference is component
	 */
	protected checkPdc(reference: EntityReference): boolean {
		if (this.entity.type !== EntityType.PLUGIN) return;

		const entity = this.bento.entities.getEntity(reference);
		if (!entity) return;

		if (entity.type === EntityType.COMPONENT) {
			throw new ApiError(this.entity, `Plugin cannot depend on ${entity.name}(component)`);
		}
	}

	/**
	 * Inject an entity into invoking entity
	 * @param reference Entity name or reference
	 * @param injectName Property name to inject to
	 */
	public injectEntity(reference: EntityReference, injectName: string | symbol): void {
		const name = this.bento.entities.resolveReference(reference);

		if (this.hasPlugin(name)) this.injectPlugin(name, injectName);
		else if (this.hasComponent(name)) this.injectComponent(name, injectName);
		else throw new ApiError(this.entity, 'Unable to inject non-existent entity');
	}

	/**
	 * Inject plugin into invoking entity
	 * @param reference Plugin name or reference
	 * @param injectName property name to inject into
	 */
	public injectPlugin(reference: PluginReference, injectName: string | symbol): void {
		if (!this.hasPlugin(reference)) throw new ApiError(this.entity, `Unable to inject non-existent plugin "${reference}"`);

		Object.defineProperty(this.entity, injectName, {
			configurable: true,
			enumerable: true,
			get: () => this.getPlugin<Plugin>(reference),
			set: () => {
				throw new IllegalAccessError('Cannot write to injected plugin');
			},
		});
	}

	/**
	 * Inject component dependency into invoking entity
	 * @param reference Component name or reference
	 * @param injectName property name to inject into
	 */
	public injectComponent(reference: ComponentReference, injectName: string | symbol): void {
		if (!this.hasComponent(reference)) throw new ApiError(this.entity, `Unable to inject non-existent component "${reference}"`);

		// prevent inject of component into plugin
		this.checkPdc(reference);

		Object.defineProperty(this.entity, injectName, {
			configurable: true,
			enumerable: true,
			get: () => this.getComponent<Component>(reference),
			set: () => {
				throw new IllegalAccessError('Cannot write to injected component');
			},
		});
	}

	/**
	 * Defines and attaches a variable to component
	 * @param definition Variable definition
	 * @param injectName property name to inject into
	 */
	public injectVariable(definition: VariableDefinition, injectName?: string | symbol): void {
		if (!definition.name) throw new ApiError(this.entity, 'VariableDefinition must have a name');

		// if variable not in bento, and no default defined. Throw an error
		if (!this.hasVariable(definition.name) && definition.default === undefined) {
			throw new ApiError(this.entity, `Cannot inject non-existant variable "${definition.name}"`);
		}

		const property = injectName || definition.name;

		// attach property to component
		Object.defineProperty(this.entity, property, {
			configurable: true,
			enumerable: false,
			get: () => this.getVariable<unknown>(definition),
			set: () => {
				throw new IllegalAccessError('Cannot write to injected variable');
			},
		});
	}

	/**
	 * Emit a event on Bento Events
	 * @param eventName Name of event
	 * @param args Ordered Array of args to emit
	 */
	public emit(eventName: string, ...args: Array<any>): void {
		const emitter = this.bento.entities.getEvents(this.entity.name);
		emitter.emit(eventName, ...args);
	}

	/**
	 * Emit subject event on Bento Events
	 * @param eventName Name of event
	 * @param args Ordered Array of args to emit
	 */
	public emitSubject(eventName: string, ...args: Array<any>): void {
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
	public forwardEvents(fromEmitter: EventEmitterLike, events: Array<string>): void {
		if (events != null && !Array.isArray(events)) throw new ApiError(this.entity, 'Events is not an array');

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
	 * @param event Name of the event
	 * @param handler The function to be called
	 * @param context Optional `this` context for prior handler function
	 *
	 * @returns Subscription ID
	 */
	// tslint:disable-next-line:max-params
	public subscribe(reference: EntityReference, event: string, handler: (...args: Array<any>) => void, context?: unknown): number {
		const name = this.bento.entities.resolveReference(reference);
		if (!name) throw new ApiError(this.entity, 'Unable to subscribe to non-existant entity');

		// prevent plugin subscribing to component events
		this.checkPdc(reference);

		// Get the namespace
		const events = this.bento.entities.getEvents(name);
		const id = events.subscribe(event, handler, context);

		// Register subscription so if the current component unloads we can remove all events
		// TODO: If the componentName component unloads we need to remove that array
		if (!this.subscriptions.has(name)) this.subscriptions.set(name, []);
		this.subscriptions.get(name).push(id);

		return id;
	}

	/**
	 * Alias for subscribe with normal event
	 * @param reference Entity Reference / Name
	 * @param event Name of the event
	 * @param handler The function to be called
	 * @param context Optional `this` context for above handler function
	 *
	 * @deprecated
	 *
	 * @returns Subscription ID
	 */
	public subscribeEvent(reference: EntityReference, event: string, handler: (...args: Array<any>) => void, context?: unknown): number {
		return this.subscribe(reference, event, handler, context);
	}

	/**
	 * Ubsubscribe from a Component Event
	 * @param reference - Component Reference / Name
	 * @param id - subscription id provided by subscribe
	 */
	public unsubscribe(reference: EntityReference, id: number): void {
		const name = this.bento.entities.resolveReference(reference);
		if (!name) throw new ApiError(this.entity, 'Unable to unsubscribe from non-existant entity');

		// Check if the component events exists
		const events = this.bento.entities.getEvents(name);
		if (events == null) return;

		// Check if this subscriber actually exists
		const subscriber = this.subscriptions.get(name);
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
	public unsubscribeAll(reference?: EntityReference): void {
		if (reference != null) {
			const name = this.bento.entities.resolveReference(reference);
			if (!name) throw new ApiError(this.entity, 'Unable to ubsubscribeAll to non-existant entity');

			if (!this.bento.entities.hasEvents(name)) return;
			const events = this.bento.entities.getEvents(name);

			// Get subscriptions on that component
			const subscriptions = this.subscriptions.get(name);
			if (subscriptions == null) return;

			// Unsubscribe from all events
			for (const subId of subscriptions) {
				events.unsubscribe(subId);
			}

			// Remove array
			this.subscriptions.delete(name);
		} else {
			// No componentName was given so we unsubscribe everything
			for (const ns of this.subscriptions.keys()) {
				this.unsubscribeAll(ns);
			}
		}
	}
}
