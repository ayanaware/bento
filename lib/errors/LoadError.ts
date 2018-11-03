'use strict';

import { AyanaError, GlobalInstanceOf } from '@ayana/errors';

@GlobalInstanceOf('@ayana/components', '1')
export class LoadError extends AyanaError {

	public readonly componentLocation: string;

	constructor(componentLocation: string, msg: string = 'Failed to load component') {
		if (componentLocation == null) componentLocation = 'Unknown component location';

		super(`${msg}: ${componentLocation}`);

		this.define('componentLocation', componentLocation);
	}

}
