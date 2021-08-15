import { InstanceType } from '../../types/InstanceType';
import type { Entity } from '../interfaces/Entity';

export type EntityReference<T extends Entity = Entity> = string | Entity | InstanceType<T>;
