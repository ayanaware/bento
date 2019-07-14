
import { ProcessingError } from '@ayana/errors';

import { Component } from '../../../components';
import { DetectedComponent } from '../../../decorators/internal';
import { PluginAPI } from '../../PluginAPI';

/**
 * Abstract loader class containing an interface to the outside and core functionality
 */
export abstract class ComponentLoader {
	/**
	 * The currently attached Bento instance
	 */
	public api: PluginAPI = null;

	/**
	 * This method can and will be called by components desiring to load peer components
	 *
	 * @param args Loader specific implementation
	 */
	public abstract async loadComponents(...args: Array<any>): Promise<void>;

	/**
	 * Detects if a value is component-like.
	 * Component-like values are objects that are not null and functions
	 *
	 * @param v The value to check
	 * @returns boolean
	 */
	private componentLike(v: any): boolean {
		return v != null && (typeof v === 'function' || typeof v === 'object');
	}

	/**
	 * Detects if a value is class-like.
	 * Class-like values are functions that have a prototype object on them
	 *
	 * @param v The value to check
	 * @returns boolean
	 */
	private classLike(v: any): boolean {
		return typeof v === 'function' && typeof v.prototype === 'object';
	}

	/**
	 * Tries to find a component in a node module. A component can be a class or an object.
	 * The instantiate() method will attempt an instantiation if it's a class.
	 *
	 * @param nodeModule The node module that should be checked
	 *
	 * @returns DetectedComponent
	 */
	protected findComponent(nodeModule: any): DetectedComponent {
		// Check ESModule flag
		if (nodeModule.__esModule) {
			// Check default export
			if (this.componentLike(nodeModule.default)) {
				return {
					classLike: this.classLike(nodeModule.default),
					obj: nodeModule.default,
					esModule: true,
				};
			}

			// Loop over object keys to find possible export
			const keys = Object.keys(nodeModule);
			let componentObject = null;

			for (const key of keys) {
				const obj = nodeModule[key];

				if (this.componentLike(obj)) {
					if (componentObject != null) {
						// Throw error if multiple possible objects were found
						throw new ProcessingError('ESModule defines multiple component-like exports but no default one');
					}

					componentObject = obj;
				}
			}

			// Return if found
			if (componentObject != null) {
				return {
					classLike: this.classLike(componentObject),
					obj: componentObject,
					esModule: true,
				};
			}

			// Throw error if not
			throw new ProcessingError('ESModule defines no component-like exports');
		} else {
			if (!this.componentLike(nodeModule)) throw new ProcessingError('CommonJS module export is not component-like');

			return { classLike: this.classLike(nodeModule), obj: nodeModule, esModule: false };
		}
	}

	/**
	 * Instantiates a component if it is a class. If it isn't the object is returned.
	 *
	 * @param component The detected component
	 *
	 * @returns Instantiated Component
	 */
	protected instantiate<T = Component>(component: DetectedComponent): T {
		if (component.classLike) {
			try {
				return new component.obj();
			} catch (e) {
				throw new ProcessingError('Failed to instantiate component').setCause(e);
			}
		} else {
			return component.obj;
		}
	}
}
