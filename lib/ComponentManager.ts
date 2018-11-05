'use strict';

import * as crypto from 'crypto';

import * as EventEmitter from 'eventemitter3';

import Logger from '@ayana/logger';

import { ComponentRegistrationError } from './errors';
import { ComponentAPI } from './helpers/ComponentAPI';
import { ComponentEvents } from './helpers/ComponentEvents';
import { PrimaryComponent, SecondaryComponent } from './interfaces';
import { DecoratorSubscription } from './interfaces/internal';

export interface ComponentManagerOptions { }

const log = Logger.get('ComponentManager');

export class ComponentManager extends EventEmitter {

	public readonly primary: Map<string, PrimaryComponent>;
	public readonly secondary: Map<string, SecondaryComponent>;

	private readonly pending: Map<string, PrimaryComponent>;

	public readonly events: Map<string, ComponentEvents>;

	public readonly opts: ComponentManagerOptions;

	constructor(opts?: ComponentManagerOptions) {
		super();

		this.primary = new Map();
		this.secondary = new Map();

		this.pending = new Map();

		this.events = new Map();

		this.opts = opts;
	}

	public createID(len: number = 16) {
		return crypto.randomBytes(len)
			.toString('base64')
			.replace(/[^a-z0-9]/gi, '')
			.slice(0, len);
	}

	public async addPrimaryComponent(component: PrimaryComponent): Promise<string> {
		if (!component.name) throw new ComponentRegistrationError(component, `Primary components must specify a name`);
		if (this.primary.has(component.name)) throw new ComponentRegistrationError(component, `Primary component names must be unique`);

		if (!component.dependencies || component.dependencies.length === 0) {
			// Zero dependency primary component, insta-load
			const success = await this.registerPrimaryComponent(component);

			// If any pending components attempt to handle them now
			if (success && this.pending.size > 0) await this.handlePendingComponents();
		} else {
			// determine dependencies
			const missing = this.getMissingDependencies(component);
			if (missing.length === 0) {
				// All dependencies are already loaded
				const success = await this.registerPrimaryComponent(component);

				// if any pending components attempt to handle them now
				if (success && this.pending.size > 0) await this.handlePendingComponents();
			} else {
				// not able to load this component yet :c
				this.pending.set(component.name, component);
			}
		}

		return component.name;
	}

	public async removePrimaryComponent(name: string) {
		const component = this.primary.get(name);
		if (!component) throw new Error(`Primary Component '${name}' is not currently loaded.`);

		// TODO: check if required, required components can't be unloaded

		// call unMount
		if (component.onUnload) {
			try {
				await component.onUnload();
			} catch (e) {
				// force unload
			}
		}
	}

	private async registerPrimaryComponent(component: PrimaryComponent): Promise<boolean> {
		// Primary component name (existence was checked before)
		Object.defineProperty(component, 'name', {
			configurable: true,
			writable: false,
			enumerable: true,
			value: component.name,
		});

		// Check and define dependencies
		if (component.dependencies != null && !Array.isArray(component.dependencies)) {
			throw new ComponentRegistrationError(component, 'Component dependencies are not an array');
		}

		Object.defineProperty(component, 'dependencies', {
			configurable: true,
			writable: false,
			enumerable: true,
			value: component.dependencies || [],
		});

		// Define __primary
		Object.defineProperty(component, '__primary', {
			configurable: false,
			writable: false,
			enumerable: false,
			value: true,
		});

		// Create components' api
		const api = new ComponentAPI(component.name, this);

		// Define api
		Object.defineProperty(component, 'api', {
			configurable: false,
			writable: false,
			enumerable: true,
			value: api,
		});

		// Create primary component event helper if it doesn't already exist
		if (!this.events.has(component.name)) {
			const events = new ComponentEvents(component.name);
			this.events.set(component.name, events);
		}

		// Call onLoad if present
		if (component.onLoad) {
			try {
				await component.onLoad();
			} catch (e) {
				throw new ComponentRegistrationError(component, `Primary component '${component.name}' failed loading`).setCause(e);
				return false;
			}
		}

		this.primary.set(component.name, component);

		// Subscribe to all the events from the decorator subscriptions
		const subscriptions: DecoratorSubscription[] = (component.constructor as any)._subscriptions;
		if (Array.isArray(subscriptions)) {
			for (const subscription of subscriptions) {
				api.subscribe(subscription.type, subscription.namespace, subscription.name, subscription.handler, component);
			}
		}

		return true;
	}

	private getMissingDependencies(component: PrimaryComponent): string[] {
		if (!component.dependencies) return [];

		return component.dependencies.reduce((a, depend) => {
			if (!this.primary.has(depend)) a.push(depend);

			return a;
		}, []);
	}

	private async handlePendingComponents(): Promise<void> {
		let loaded = 0;

		for (const component of this.pending.values()) {
			const missing = await this.getMissingDependencies(component);
			if (missing.length === 0) {
				this.pending.delete(component.name);

				const success = await this.registerPrimaryComponent(component);
				if (success) loaded++;
			}
		}

		if (loaded > 0) await this.handlePendingComponents();
	}

	public async addSecondaryComponent(component: SecondaryComponent) {
		// TODO Add check if pending components are still there
		// TODO Also add explicit depends to secondary components and check them
		await this.registerSecondaryComponent(component);

		return component.name;
	}

	public async removeSecondaryComponent(id: string) {
		const component = this.secondary.get(id);
		if (!component) throw new Error(`Component '${id}' is not currently loaded.`);

		// call unMount
		if (component.onUnload) {
			try {
				await component.onUnload();
			} catch (e) {
				// force unload
			}
		}
	}

	private async registerSecondaryComponent(component: SecondaryComponent) {
		// generate uniqueID (name)
		const name = this.createID();

		// apply it to component
		Object.defineProperty(component, 'name', {
			configurable: true,
			writable: false,
			enumerable: true,
			value: name,
		});

		const api = new ComponentAPI(name, this);

		// define api
		Object.defineProperty(component, 'api', {
			configurable: false,
			writable: false,
			enumerable: true,
			value: api,
		});

		// call onMount
		if (component.onLoad) {
			try {
				await component.onLoad();
			} catch (e) {
				return false;
			}
		}

		this.secondary.set(name, component);
		return true;
	}
}

export interface ComponentManager {
	on(event: 'error', listener: (error: Error) => void): this;
}
