
import { Entity } from '../entities/interfaces/Entity';

import { BentoError } from './BentoError';

export class ApiError extends BentoError {
	public readonly entity: Entity;

	public constructor(entity: Entity, msg: string) {
		super(`${entity.name}(${entity.type}) ${msg}`);

		this.__define('entity', entity);
	}
}
