
import { IllegalArgumentError, IllegalStateError } from '@ayanaware/errors';

import { Bento } from '../../Bento';
import {
	getChildOfDecoratorInjection,
	getInjectDecoratorInjections,
	getParentDecoratorInjection,
	getSubscribeDecoratorInjections,
	getVariableDecoratorInjections,
} from '../../decorators/internal';
import { ComponentRegistrationError } from '../../errors';
import { PluginHook } from '../../plugins/internal';
import { ComponentReference } from '../../references';
import { ReferenceManager } from '../../references/internal';
import { ComponentAPI } from '../ComponentAPI';
import { Component } from '../interfaces';

import { ComponentEvents } from './ComponentEvents';

export interface PendingComponentInfo {
	name: string;
	component: Component;
	missing: Array<ComponentReference>;
}

export class ComponentManager {
	private readonly bento: Bento;

	private readonly references: ReferenceManager<Component> = new ReferenceManager();

	private readonly components: Map<string, Component> = new Map();
	private readonly pending: Map<string, Component> = new Map();

	private readonly events: Map<string, ComponentEvents> = new Map();

	public constructor(bento: Bento) {
		this.bento = bento;
	}

	/**
	 * Delegate for the resolveName function
	 *
	 * @param reference Component instance, name or reference
	 *
	 * @see ReferenceManager#resolveName
	 * @returns resolved component name
	 */
	public resolveName(reference: ComponentReference) {
		return this.references.resolveName(reference);
	}

	/**
	 * Check if a given component exists
	 *
	 * @param reference Component instance, name or reference
	 *
	 * @returns boolean
	 */
	public hasComponent(reference: ComponentReference) {
		const name = this.resolveName(reference);

		return this.components.has(name);
	}

	/**
	 * Get component instance
	 * @param reference - Component name or reference
	 *
	 * @returns Component instance
	 */
	public getComponent<T extends Component>(reference: ComponentReference): T {
		const name = this.resolveName(reference);
		if (!this.components.has(name)) return null;

		return this.components.get(name) as T;
	}

	/**
	 * Get instances of all currently loaded componets
	 *
	 * @returns Array of component instances
	 */
	public getComponents(): Array<Component> {
		return Array.from(this.components.values());
	}

	/**
	 * Check if a given component events exists
	 * @param reference - Component name or reference
	 *
	 * @returns boolean
	 */
	public hasComponentEvents(reference: ComponentReference) {
		const name = this.resolveName(reference);

		return this.events.has(name);
	}

	/**
	 * Get component events instance or create it
	 * @param reference - Component name or reference
	 *
	 * @returns Component events instance
	 */
	public getComponentEvents(reference: ComponentReference) {
		const name = this.resolveName(reference);
		if (!this.hasComponentEvents(name)) {
			const events = new ComponentEvents(name, this.bento.options);
			this.events.set(name, events);

			return events;
		}

		return this.events.get(name);
	}

	/**
	 * Fetches all child components of a given parent component
	 * @param parent - parent component name or reference
	 *
	 * @returns Array of child components
	 */
	public getComponentChildren<T extends Component>(parent: ComponentReference): Array<T> {
		const name = this.resolveName(parent);
		if (!this.components.has(name)) throw new IllegalStateError(`Parent "${name}" is not loaded`);

		const children: Array<T> = [];
		for (const component of this.components.values()) {
			if (component.parent != null && name === this.resolveName(component.parent)) {
				children.push(component as T);
			}
		}

		return children;
	}

	/**
	 * Returns an array of dependencies requested but not loaded yet.
	 *
	 * @param component The requested dependencies
	 *
	 * @returns An array of dependencies requested but not loaded
	 */
	public getMissingDependencies(component: ComponentReference): Array<string> {
		try {
			const name = this.resolveName(component);
			if (this.components.has(name)) component = this.components.get(name);
		} catch (e) {
			// 00f
		}

		if (component == null || typeof component !== 'object') throw new IllegalArgumentError(`Component must be an object`);
		if (component.dependencies == null || !Array.isArray(component.dependencies)) throw new IllegalArgumentError(`Component dependencies must be an array`);

		return component.dependencies.reduce((a, d) => {
			try {
				const name = this.resolveName(d);
				if (!this.components.has(name)) a.push(name);
			} catch (e) {
				a.push(d);
			}

			return a;
		}, []);
	}

	/**
	 * @see PendingComponentInfo
	 * @returns - All currently pending bento components and their info
	 */
	public getPendingComponents(): Array<PendingComponentInfo> {
		const pending: Array<PendingComponentInfo> = [];

		for (const [name, component] of this.pending.entries()) {
			// get pending items
			const missing = this.getMissingDependencies(component);

			pending.push({
				name,
				component,
				missing,
			});
		}

		return pending;
	}

	/**
	 * Add a Component to Bento
	 * @param component - Component
	 *
	 * @returns Component name
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
		const missing = this.getMissingDependencies(component);
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

		// if we have any children lets unload them first
		const children = this.getComponentChildren(component);
		if (children.length > 0) {
			for (const child of children) {
				await this.removeComponent(child.name);
			}
		}

		// onPreComponentUnload
		await (this.bento.plugins as any).__handlePluginHook(PluginHook.onPreComponentUnload, component);

		// call unMount
		if (component.onUnload) {
			try {
				await component.onUnload();
			} catch (e) {
				// Ignore
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
						// Ignore
					}
				}
			}
		}

		// remove all event subscriptions
		component.api.unsubscribeAll();

		// remove componentConstructor
		this.references.removeReference(component);

		// delete component
		if (this.components.has(component.name)) {
			this.components.delete(component.name);
		}

		// onPostComponentUnload
		await (this.bento.plugins as any).__handlePluginHook(PluginHook.onPostComponentUnload, component);
	}

	/**
	 * Attach Decorator data to Component
	 *
	 * @param component Component
	 */
	private prepareDecorators(component: Component) {
		// @ChildOf
		if (getChildOfDecoratorInjection(component) != null) {
			if (component.parent != null) throw new ComponentRegistrationError(component, 'Parent already defined. Can\'t prepare @ChildOf decorator');

			component.parent = getChildOfDecoratorInjection(component).reference;
		}

		// @Inject Decorator
		getInjectDecoratorInjections(component).forEach(i => component.dependencies.push(i.reference));

		// @Subscribe Decorator
		getSubscribeDecoratorInjections(component).forEach(s => component.dependencies.push(s.reference));
	}

	/**
	 * Handle Decorator Injections
	 *
	 * @param component Component
	 */
	private handleDecorators(component: Component) {
		// @Inject Decorator
		for (const injection of getInjectDecoratorInjections(component)) {
			component.api.injectComponent(injection.reference, injection.propertyKey);
		}

		// @Parent Decorator
		if (component.parent && getParentDecoratorInjection(component) != null) {
			Object.defineProperty(component, getParentDecoratorInjection(component).propertyKey, {
				configurable: true,
				writable: false,
				enumerable: true,
				value: component.parent,
			});
		}

		// @Subscribe Decorator
		for (const injection of getSubscribeDecoratorInjections(component)) {
			component.api.subscribe(injection.reference, injection.eventName, injection.handler, component);
		}

		// @Variable Decorator
		for (const injection of getVariableDecoratorInjections(component)) {
			component.api.injectVariable(injection.definition, injection.propertyKey);
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

		this.prepareDecorators(component);

		// Append parent to dependencies
		if (component.parent) component.dependencies.push(component.parent);

		// remove any duplicates or self from dependencies
		component.dependencies = component.dependencies.reduce((a, d) => {
			// prevent any dependencies to self
			if (this.references.resolveNameSafe(d) === component.name) return a;

			// ensure zero duplicates
			if (!Array.prototype.includes.call(a, d)) a.push(d);

			return a;
		}, []);

		// Create and inject component api
		const api = new ComponentAPI(this.bento, component);
		Object.defineProperty(component, 'api', {
			configurable: true,
			writable: false,
			enumerable: true,
			value: api,
		});
	}

	private async loadComponent(component: Component) {
		let parent = null;
		if (component.parent) {
			component.parent = this.resolveName(component.parent);
			if (!this.components.has(component.parent)) throw new IllegalStateError(`Somehow a child component loaded before their parent!`); // aka, universe bork

			parent = this.components.get(component.parent);
		}

		this.handleDecorators(component);

		// onPreComponentLoad
		await (this.bento.plugins as any).__handlePluginHook(PluginHook.onPreComponentLoad, component);

		// Call onLoad if present
		if (component.onLoad) {
			try {
				await component.onLoad(component.api);
			} catch (e) {
				throw new ComponentRegistrationError(component, `Component "${component.name}" failed to load`).setCause(e);
			}
		}

		// if we just loaded a child component, lets inform the parent
		if (parent != null && parent.onChildLoad) {
			try {
				await parent.onChildLoad(component);
			} catch (e) {
				throw new ComponentRegistrationError(component, `Parent "${component.parent}" failed to load child`).setCause(e);
			}
		}

		this.components.set(component.name, component);

		// onPostComponentLoad
		await (this.bento.plugins as any).__handlePluginHook(PluginHook.onPostComponentLoad, component);
	}

	private async handlePendingComponents(): Promise<void> {
		let loaded = 0;

		for (const component of this.pending.values()) {
			const missing = this.getMissingDependencies(component);
			if (missing.length === 0) {
				this.pending.delete(component.name);

				await this.loadComponent(component);
				loaded++;
			}
		}

		if (loaded > 0) await this.handlePendingComponents();
	}
}
