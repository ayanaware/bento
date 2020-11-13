import { SharedAPI } from '../api';
import { EntityReference } from '../references/types';

export enum EntityType {
	PLUGIN = 'plugin',
	COMPONENT = 'component',
}

export interface Entity {
	type?: EntityType;
	api?: SharedAPI;

	name: string;
	version?: string;

	dependencies?: Array<EntityReference>;
	parent?: EntityReference;

	// General lifecycle events
	onLoad?(api?: SharedAPI): Promise<void>;
	onUnload?(): Promise<void>;

	// Parent lifecycle events
	onChildLoad?(child: Entity): Promise<void>;
	onChildUnload?(child: Entity): Promise<void>;
}
