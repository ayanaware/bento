'use strict';

import { IllegalStateError } from '@ayana/errors';

import { Bento } from '../../Bento';
import { ComponentLoadError } from '../../errors';
import { PrimaryComponent, SecondaryComponent } from '../../interfaces';
import { DetectedComponent } from '../../interfaces/internal';

/**
 * Abstract Loader class containing an interface to the outside and core functionality
 */
export abstract class Loader {

	/**
	 * The currently attached Bento instance
	 */
	protected bento: Bento = null;

	/**
	 * Loads the components. This only works if a Bento is attached
	 */
	public abstract async onLoad(): Promise<void>;

	/**
	 * Detects if a value is component-like.
	 * Component-like values are objects that are not null and functions
	 *
	 * @param v The value to check
	 */
	private componentLike(v: any): boolean {
		return v != null && (typeof v === 'function' || typeof v === 'object');
	}

	/**
	 * Detects if a value is class-like.
	 * Class-like values are functions that have a prototype object on them
	 *
	 * @param v The value to check
	 */
	private classLike(v: any): boolean {
		return typeof v === 'function' && typeof v.prototype === 'object';
	}

	/**
	 * Tries to find a component in a node module. A component can be a class or an object.
	 * The instantiate() method will attempt an instantiation if it's a class.
	 *
	 * @param nodeModule The node module that should be checked
	 * @param componentLocation The component's location if it's known
	 */
	protected findComponent(nodeModule: any, componentLocation?: string): DetectedComponent {
		// Check ESModule flag
		if (nodeModule.__esModule) {
			// Check default export
			if (this.componentLike(nodeModule.default)) {
				return {
					classLike: this.classLike(nodeModule.default),
					obj: nodeModule.default,
					esModule: true
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
						throw new ComponentLoadError(componentLocation, 'ESModule defines multiple component-like exports but no default one');
					}

					componentObject = obj;
				}
			}

			// Return if found
			if (componentObject != null) {
				return {
					classLike: this.classLike(componentObject),
					obj: componentObject,
					esModule: true
				};
			}

			// Throw error if not
			throw new ComponentLoadError(componentLocation, 'ESModule defines no component-like exports');
		} else {
			if (!this.componentLike(nodeModule)) throw new ComponentLoadError(componentLocation, 'CommonJS module export is not component-like');

			return { classLike: this.classLike(nodeModule), obj: nodeModule, esModule: false };
		}
	}

	/**
	 * Instantiates a component if it is a class. If it isn't the object is returned.
	 *
	 * @param component The detected component
	 * @param componentLocation The component's location if it's known
	 */
	protected instantiate<T = PrimaryComponent | SecondaryComponent>(component: DetectedComponent, componentLocation?: string): T {
		if (component.classLike) {
			try {
				return new component.obj();
			} catch (e) {
				throw new ComponentLoadError(componentLocation, 'Failed to instantiate component').setCause(e);
			}
		} else {
			return component.obj;
		}
	}

}
