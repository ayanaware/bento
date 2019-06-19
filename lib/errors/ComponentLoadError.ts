'use strict';

import { GlobalInstanceOf } from '@ayana/errors';

import { ComponentError } from './ComponentError';

@GlobalInstanceOf('@ayana/bento', '1')
export class ComponentLoadError extends ComponentError {
	constructor(location: string, msg: string = 'Failed to load component') {
		if (location == null) location = 'Unknown component location';

		super(msg);

		this.__define('location', location);
	}
}
