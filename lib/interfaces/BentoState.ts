import { EntityType } from '../entities/interfaces/Entity';

export interface BentoState {
	entities: Array<{ type: EntityType, name: string }>;
	variables: Array<string>;
}
