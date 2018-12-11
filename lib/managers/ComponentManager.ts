'use strict';

import { IllegalArgumentError, IllegalStateError } from '@ayana/errors';

import { Bento } from '../Bento';
import { Symbols } from '../constants/internal';
import { ComponentAPI, ComponentEvents } from '../helpers';
import { Component } from '../interfaces';
import { DecoratorSubscription, DecoratorVariable } from '../interfaces/internal';

import { ComponentRegistrationError } from '../errors';

export class ComponentManager {
	private bento: Bento;

	private readonly components: Map<string, Component> = new Map();
	private readonly pending: Map<string, Component> = new Map();

	private readonly constructors: Map<any, string> = new Map();

	private readonly events: Map<string, ComponentEvents> = new Map();

	constructor(bento: Bento) {
		this.bento = bento;
	}

	/**
	 * Get component instance
	 * @param component - Component name or reference
	 */
	public getComponent(reference: Component | string) {
		const name = this.resolveName(reference);
		if (!this.components.has(name)) return null;

		return this.components.get(name);
	}

	/**
	 * Get component events instance
	 * @param component - Component name or reference
	 */
	public getComponentEvents(component: Component | string) {
		const name = this.resolveName(component);
		if (!this.events.has(name)) return null;

		return this.events.get(name);
	}

	/**
	 * Fetches all child components of a given parent component
	 * @param parent - parent component name or reference
	 */
	public getComponentChildren(parent: Component | string) {
		const name = this.resolveName(parent);
		if (!this.components.has(name)) throw new IllegalStateError(`Parent "${name}" is not loaded`);

		const children: Component[] = [];
		for (const component of this.components.values()) {
			if (component.parent != null && name === this.resolveName(component.parent)) {
				children.push(component);
			}
		}

		return children;
	}

	/**
	 * @param reference - Component name or reference
	 */
	public resolveName(reference: Component | string) {
		let name = null;
		if (typeof reference === 'string') name = reference;
		else if (reference != null) {
			// check if we have the constructor
			if (this.constructors.has(reference)) name = this.constructors.get(reference);

			// check if .name exists on the object
			else if (Object.prototype.hasOwnProperty.call(reference, 'name')) name = reference.name;
		}

		if (name == null) throw new Error('Could not determine component name');
		return name;
	}

	/**
	 * Add a Component to Bento
	 * @param component - Component
	 */
	public async addComponent(component: Component): Promise<string> {
		if (component == null || typeof component !== 'object') throw new IllegalArgumentError('Component must be a object');
		if (typeof component.name !== 'string') throw new IllegalArgumentError('Component name must be a string');
		if (!component.name) throw new ComponentRegistrationError(component, 'Components must specify a name');
		if (this.components.has(component.name)) throw new ComponentRegistrationError(component, `Component name "${component.name}" must be unique`);

		// Check dependencies
		if (component.dependencies != null && !Array.isArray(component.dependencies)) {
			throw new ComponentRegistrationError(component, `"${component.name}" Component dependencies is not an array`);
		} else if (component.dependencies == null) component.dependencies = [];

		// prepare component
		this.prepareComponent(component);

		// determine dependencies
		const missing = this.getMissingDependencies(component.dependencies);
		if (missing.length === 0) {
			// All dependencies are already loaded, go ahead and load the component
			await this.loadComponent(component);

			// loaded successfuly, if any pending components, attempt to handle them now
			if (this.pending.size > 0) await this.handlePendingComponents();
		} else {
			// not able to load this component yet :c
			this.pending.set(component.name, component);
		}

		return component.name;
	}

	/**
	 * Remove a Component from Bento
	 * @param name - Name of component
	 */
	public async removeComponent(name: string) {
		if (typeof name !== 'string') throw new IllegalArgumentError('Name must be a string');
		if (!name) throw new IllegalArgumentError('Name must not be empty');

		const component = this.components.get(name);
		if (!component) throw new Error(`Component '${name}' is not currently loaded.`);

		// TODO: check if required, required components can't be unloaded

		// if we have any children lets unload them first
		const children = this.getComponentChildren(component);
		if (children.length > 0) {
			for (const child of children) {
				await this.removeComponent(child.name);
			}
		}

		// call unMount
		if (component.onUnload) {
			try {
				await component.onUnload();
			} catch (e) {
				// force unload
			}
		}

		// if we were a child, inform parent of our unloading
		if (component.parent) {
			component.parent = this.resolveName(component.parent);

			if (this.components.has(component.parent)) {
				const parent = this.components.get(component.parent);

				if (parent.onChildUnload) {
					try {
						await parent.onChildUnload(component);
					} catch (e) {
						// throw new ComponentRegistrationError(component, `Parent "${component.parent}" failed to unload child`).setCause(e);
						// what do we do here?
					}
				}
			}
		}

		// remove componentConstructor
		if (component.constructor && this.constructors.has(component.constructor)) {
			this.constructors.delete(component.constructor);
		}

		// delete component
		if (this.components.has(component.name)) {
			this.components.delete(component.name);
		}
	}

	private resolveDependencies(dependencies: Array<Component | string>) {
		if (dependencies != null && !Array.isArray(dependencies)) throw new IllegalArgumentError(`Dependencies is not an array`);
		else if (dependencies == null) dependencies = [];

		const resolved = [];
		for (const dependency of dependencies) {
			try {
				const name = this.resolveName(dependency);
				resolved.push(name);
			} catch (e) {
				throw new IllegalStateError('Unable to resolve dependency').setCause(e);
			}
		}

		return resolved;
	}

	private getMissingDependencies(dependencies: Array<Component | string>) {
		if (!Array.isArray(dependencies)) throw new IllegalArgumentError(`Dependencies is not an array`);

		// run dependencies through the resolver
		dependencies = this.resolveDependencies(dependencies);

		return (dependencies as string[]).reduce((a, dependency) => {
			if (!this.components.has(dependency)) a.push(dependency);

			return a;
		}, []);
	}

	/**
	 * Enforces Bento API and prepares component to be loaded
	 * @param component - Component to be prepared
	 */
	private prepareComponent(component: Component) {
		// take control and redefine component name
		Object.defineProperty(component, 'name', {
			configurable: true,
			writable: false,
			enumerable: true,
			value: component.name,
		});

		// if component has constructor lets track it
		if (component.constructor) {
			this.constructors.set(component.constructor, component.name);
		}

		// Create component events if it does not already exist
		if (!this.events.has(component.name)) {
			const events = new ComponentEvents(component.name);
			this.events.set(component.name, events);
		}

		// handle child component depending on a parent
		if (component.parent != null) {
			// attempt to resolve
			component.parent = this.resolveName(component.parent);

			// make sure dependencies are loaded right
			component.dependencies.push(component.parent);
		}

		// run dependencies through the resolver
		Object.defineProperty(component, 'dependencies', {
			configurable: true,
			writable: false,
			enumerable: true,
			value: this.resolveDependencies(component.dependencies),
		});

		// Create components' api
		const api = new ComponentAPI(this.bento, component);

		// Define api
		Object.defineProperty(component, 'api', {
			configurable: true,
			writable: false,
			enumerable: true,
			value: api,
		});

		// Add property descriptors for all the decorated variables
		const variables: DecoratorVariable[] = (component.constructor as any)[Symbols.variables];
		if (Array.isArray(variables)) {
			for (const variable of variables) {
				component.api.injectVariable(Object.assign({}, variable.definition, { property: variable.propertyKey }));
			}
		}
	}

	private async loadComponent(component: Component) {
		let parent = null;
		if (component.parent) {
			component.parent = this.resolveName(component.parent);
			if (!this.components.has(component.parent)) throw new IllegalStateError(`Somehow a child component loaded before their parent!`); // aka, universe bork

			parent = this.components.get(component.parent);
		}

		// if child. lets modify name a bit
		if (parent != null && !component.name.startsWith(`${parent.name}.`)) {
			Object.defineProperty(component, 'name', {
				configurable: true,
				writable: false,
				enumerable: true,
				value: `${parent.name}.${component.name}`,
			});
		}

		// Subscribe to all the events from the decorator subscriptions
		const subscriptions: DecoratorSubscription[] = (component.constructor as any)[Symbols.subscriptions];
		if (Array.isArray(subscriptions)) {
			for (const subscription of subscriptions) {
				component.api.subscribe(subscription.type, subscription.namespace, subscription.name, subscription.handler, component);
			}
		}

		// Call onLoad if present
		if (component.onLoad) {
			try {
				await component.onLoad(component.api);
			} catch (e) {
				throw new ComponentRegistrationError(component, `Component "${component.name}" failed loading`).setCause(e);
			}
		}

		// if we just loaded a child component, lets inform the parent
		if (parent != null) {
			if (parent.onChildLoad) {
				try {
					await parent.onChildLoad(component);
				} catch (e) {
					throw new ComponentRegistrationError(component, `Parent "${component.parent}" failed to load child`).setCause(e);
				}
			}
		}

		this.components.set(component.name, component);
	}

	private async handlePendingComponents(): Promise<void> {
		let loaded = 0;

		for (const component of this.pending.values()) {
			const missing = await this.getMissingDependencies(component.dependencies);
			if (missing.length === 0) {
				this.pending.delete(component.name);

				await this.loadComponent(component);
				loaded++;
			}
		}

		if (loaded > 0) await this.handlePendingComponents();
	}
}
