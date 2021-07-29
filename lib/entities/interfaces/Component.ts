import type { ComponentAPI } from '../api/ComponentAPI';

import { Entity, EntityType } from './Entity';

export interface Component extends Entity {
	type?: EntityType.COMPONENT;
	api?: ComponentAPI;

	onLoad?(api?: ComponentAPI): Promise<void>;
}
