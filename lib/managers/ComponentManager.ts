'use strict';

import { IllegalArgumentError, IllegalStateError, ProcessingError } from '@ayana/errors';

import { Bento } from '../Bento';
import { ComponentRegistrationError } from '../errors';
import { ComponentAPI, ComponentEvents } from '../helpers';
import { Decorators } from '../helpers/internal';
import { Component } from '../interfaces';

import { ReferenceManager } from './ReferenceManager';

export class ComponentManager {

	private readonly bento: Bento;

	private readonly references: ReferenceManager<Component> = new ReferenceManager();

	private readonly components: Map<string, Component> = new Map();
	private readonly pending: Map<string, Component> = new Map();

	private readonly events: Map<string, ComponentEvents> = new Map();

	constructor(bento: Bento) {
		this.bento = bento;
	}

	/**
	 * Delegate for the resolveName function
	 *
	 * @param reference Component instance, name or reference
	 *
	 * @see ReferenceManager#resolveName
	 */
	public resolveName(reference: Component | string | any) {
		return this.references.resolveName(reference);
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
	 * Add a Component to Bento
	 * @param component - Component
	 */
	public async addComponent(component: Component): Promise<string> {
		if (component == null || typeof component !== 'object') throw new IllegalArgumentError('Component must be a object');
		if (typeof component.name !== 'string') throw new IllegalArgumentError('Component name must be a string');
		if (!component.name) throw new ComponentRegistrationError(component, 'Components must specify a name');
		if (this.components.has(component.name)) throw new ComponentRegistrationError(component, `Component name "${component.name}" must be unique`);

		// Check dependencies
		if (component.dependencies == null) component.dependencies = [];
		if (component.dependencies != null && !Array.isArray(component.dependencies)) {
			throw new ComponentRegistrationError(component, `"${component.name}" Component dependencies is not an array`);
		}

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
		this.references.removeReference(component);

		// delete component
		if (this.components.has(component.name)) {
			this.components.delete(component.name);
		}
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
		this.references.addReference(component);

		// Create component events if it does not already exist
		if (!this.events.has(component.name)) {
			const events = new ComponentEvents(component.name);
			this.events.set(component.name, events);
		}

		// handle child component depending on a parent
		if (component.parent != null) {
			// make sure dependencies are loaded right
			component.dependencies.push(component.parent);
		}

		// Add all dependencies that come from decorators
		Decorators.getInjections(component).forEach(i => component.dependencies.push(i.component));
		Decorators.getSubscriptions(component).forEach(s => component.dependencies.push(s.namespace));

		// remove any duplicates or self from dependencies
		component.dependencies = component.dependencies.reduce((a, d) => {
			// prevent any dependencies to self
			try {
				if (this.resolveName(d) === component.name) return a;
			} catch (e) {
				// resolveName was unable to get a name. Meaning this is not a self dependency
			}

			// ensure zero duplicates
			if (!Array.prototype.includes.call(a, d)) a.push(d);

			return a;
		}, []);

		// take control and redeine dependencies
		Object.defineProperty(component, 'dependencies', {
			configurable: true,
			writable: false,
			enumerable: true,
			value: component.dependencies,
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
		Decorators.handleVariables(component, api);
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

		// Inject all components from decorator subscriptions
		Decorators.handleInjections(component, component.api);

		// Subscribe to all events from decorator subscriptions
		Decorators.handleSubscriptions(component, component.api);

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

	/**
	 * Returns an array of dependencies requested but not loaded yet.
	 *
	 * @param dependencies The requested dependencies
	 *
	 * @returns An array of dependencies requested but not loaded
	 */
	private getMissingDependencies(dependencies: Array<Component | string | any>): string[] {
		if (dependencies !== null && !Array.isArray(dependencies)) throw new IllegalArgumentError(`Dependencies is not an array`);
		else if (dependencies === null) dependencies = [];

		return dependencies.reduce((a, dependency) => {
			try {
				// attempt to resolve down to name
				const name = this.resolveName(dependency);
				if (!this.components.has(name)) a.push(name);
			} catch (e) {
				// failed to resolve, pass through
				a.push(dependency);
			}

			return a;
		}, []);
	}
}
