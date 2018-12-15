'use strict';

import { IllegalArgumentError, ProcessingError } from '@ayana/errors';

import { Component } from '../interfaces';

/**
 * Sub-Manager of the [[ComponentManager]] for handling dependencies and references.
 */
export class DependencyManager {

	private readonly references: Map<any, string> = new Map();

	/**
	 * Registers a component in a reference map so the type can be used instead of the component name.
	 * This only works if the component has a constructor function.
	 *
	 * @param component The component to be registered
	 */
	public addReference(component: Component) {
		// TODO Use Symbols.runtimeIdentifier so when a component is reloaded old references won't break
		if (component.constructor != null && component.constructor !== Object) {
			this.references.set(component.constructor, component.name);
		}
	}

	/**
	 * Removes a component from the reference map.
	 * This only works if the component has a constructor function.
	 *
	 * @param component The component to be removed
	 */
	public removeReference(component: Component) {
		// TODO Use Symbols.runtimeIdentifier so when a component is reloaded old references won't break
		this.references.delete(component.constructor);
	}

	/**
	 * Resolves the name of the given component.
	 * If the given component is already a string, the same string will be returned.
	 *
	 * @param reference Component instance, name or reference
	 *
	 * @returns The components name
	 */
	public resolveName(reference: Component | string | any): string {
		let name: string = null;
		if (typeof reference === 'string') name = reference;
		else if (reference != null) {
			// Check if we have the constructor
			if (this.references.has(reference)) name = this.references.get(reference);

			// Check if property "name" exists on the object
			else if (Object.prototype.hasOwnProperty.call(reference, 'name')) name = reference.name;
		}

		if (name == null) throw new IllegalArgumentError('Given component or reference is invalid, not registered or does not have a name');
		return name;
	}

	/**
	 * Resolves an array of components to their name.
	 *
	 * @param dependencies The array of dependencies to be resolved
	 *
	 * @returns An array with names of the given components
	 *
	 * @see DependencyManager#resolveName
	 */
	public resolveDependencies(dependencies: Array<Component | string | any>): string[] {
		if (dependencies != null && !Array.isArray(dependencies)) throw new IllegalArgumentError(`Dependencies is not an array`);
		else if (dependencies == null) dependencies = [];

		const resolved: string[] = [];
		for (const dependency of dependencies) {
			try {
				const name = this.resolveName(dependency);
				resolved.push(name);
			} catch (e) {
				throw new ProcessingError('Failed to resolve dependency').setCause(e);
			}
		}

		return resolved;
	}

	/**
	 * Returns an array of dependencies requested but not loaded yet.
	 *
	 * @param dependencies The requested dependencies
	 * @param loadedComponents The already loaded components
	 *
	 * @returns An array of dependencies requested but not loaded
	 */
	public getMissingDependencies(dependencies: Array<Component | string | any>, loadedComponents: Map<string, Component>): string[] {
		if (!Array.isArray(dependencies)) throw new IllegalArgumentError(`Dependencies is not an array`);

		// Run dependencies through the resolver
		dependencies = this.resolveDependencies(dependencies);

		return (dependencies as string[]).reduce((a, dependency) => {
			if (!loadedComponents.has(dependency)) a.push(dependency);

			return a;
		}, []);
	}

}
