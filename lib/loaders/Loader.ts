'use strict';

import { PrimaryComponent, SecondaryComponent } from '../abstractions';
import { ComponentManager } from '../runtime';

export interface ComponentClass {
	classLike: boolean;
	obj: any;
	esModule: boolean;
}

export abstract class Loader {

	protected manager: ComponentManager = null;

	public attach(manager: ComponentManager) {
		this.manager = manager;
	}

	public detach() {
		this.manager = null;
	}

	public abstract async load(): Promise<void>;

	private componentLike(v: any): boolean {
		return v != null && (typeof v === 'function' || typeof v === 'object');
	}

	private classLike(v: any): boolean {
		return typeof v === 'function' && typeof v.prototype === 'object';
	}

	protected instantiate<T = PrimaryComponent | SecondaryComponent>(compClass: ComponentClass): T {
		if (compClass.classLike) {
			try {
				return new compClass.obj();
			} catch (e) {
				// TODO Wrap and throw
				throw e;
			}
		} else {
			return compClass.obj;
		}
	}

	protected getComponentClass(nodeModule: any): ComponentClass {
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
						throw new Error('ESModule defines multiple component-like exports but no default one');
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
			throw new Error('ESModule defines no component-like exports');
		} else {
			if (!this.componentLike(nodeModule)) throw new Error('CommonJS module export is not component-like');

			return { classLike: this.classLike(nodeModule), obj: nodeModule, esModule: false };
		}
	}

}
