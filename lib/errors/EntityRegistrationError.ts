import { Entity } from '../entities';

import { EntityError } from './EntityError';

export class EntityRegistrationError extends EntityError {
	public readonly entity: Entity;

	public constructor(entity: Entity, msg: string) {
		super(`${entity.name}(${entity.type}): ${msg}`);
		this.__define('entity', entity);
	}
}
