'use strict';

import { GlobalInstanceOf } from '@ayana/errors';

import { ComponentError } from './ComponentError';

@GlobalInstanceOf('@ayana/components', '1')
export class ComponentLoadError extends ComponentError {

	public readonly componentLocation: string;

	constructor(componentLocation: string, msg: string = 'Failed to load component') {
		if (componentLocation == null) componentLocation = 'Unknown component location';

		super(`${msg}: ${componentLocation}`);

		this.define('componentLocation', componentLocation);
	}

}
