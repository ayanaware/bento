import { Entity } from '../entities';

import { EntityError } from './EntityError';

export class EntityRegistrationError extends EntityError {
	public readonly entity: Entity;

	public constructor(entity: Entity, msg: string) {
		super(msg);

		this.__define('component', entity);
	}
}
