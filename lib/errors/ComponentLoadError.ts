
import { GlobalInstanceOf } from '@ayanaware/errors';

import { ComponentError } from './ComponentError';

@GlobalInstanceOf('@ayanaware/bento', '1')
export class ComponentLoadError extends ComponentError {
	public constructor(location: string, msg: string = 'Failed to load component') {
		if (location == null) location = 'Unknown component location';

		super(msg);

		this.__define('location', location);
	}
}
