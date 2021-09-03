import type { ComponentAPI } from '../api/ComponentAPI';

import { Entity, EntityType } from './Entity';

export interface Component extends Entity {
	type?: EntityType.COMPONENT;
	api?: ComponentAPI;

	/** Lifecycle: Called right before Component is fully loaded */
	onLoad?(api?: ComponentAPI): Promise<unknown>;
}
