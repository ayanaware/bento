import { ComponentAPI } from '../api/ComponentAPI';
import { EntityType } from '../interfaces';

import { Entity } from './Entity';

export interface Component extends Entity {
	type?: EntityType.COMPONENT;
	api?: ComponentAPI;

	onLoad?(api?: ComponentAPI): Promise<void>;
}
