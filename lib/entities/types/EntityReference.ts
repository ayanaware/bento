import { ContainedType } from '../../Container';
import { Entity } from '../interfaces/Entity';

export type EntityReference<T extends Entity = Entity> = string | Entity | ContainedType<T>;
