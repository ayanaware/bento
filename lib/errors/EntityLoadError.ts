import { EntityError } from './EntityError';

export class EntityLoadError extends EntityError {
	public constructor(location: string, msg: string = 'Failed to load component') {
		if (location == null) location = 'Unknown component location';

		super(msg);

		this.__define('location', location);
	}
}
