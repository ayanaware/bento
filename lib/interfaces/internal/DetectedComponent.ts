'use strict';

/**
 * Interface for the return value of the findComponent() method of the loader
 */
export interface DetectedComponent {
	/**
	 * Whether the obj property is class-like or not.
	 * If it isn't then no instantiation will be attempted by the instantiate() method of the loader
	 */
	classLike: boolean;
	/**
	 * The object component or the class for the component
	 */
	obj: any;
	/**
	 * Whether the node module was an ES-Module or not
	 */
	esModule: boolean;
}
