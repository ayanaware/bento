import { EntityAPI } from '../api/EntityAPI';
import { EntityReference } from '../types/EntityReference';

export enum EntityType {
	PLUGIN = 'plugin',
	COMPONENT = 'component',
}

export interface Entity {
	type?: EntityType;
	api?: EntityAPI;

	name: string;
	version?: string;
	replaceable?: boolean;

	dependencies?: Array<EntityReference<Entity>>;
	parent?: EntityReference<Entity>;

	// General lifecycle events
	onLoad?(api?: EntityAPI): Promise<void>;
	onUnload?(): Promise<void>;

	// Parent lifecycle events
	onChildLoad?(child: Entity): Promise<void>;
	onChildUnload?(child: Entity): Promise<void>;
}
