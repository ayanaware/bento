import type { EntityAPI } from '../api/EntityAPI';
import type { EntityReference } from '../types/EntityReference';

export enum EntityType {
	PLUGIN = 'plugin',
	COMPONENT = 'component',
}

export interface Entity {
	type?: EntityType;
	api?: EntityAPI;

	/** Entity name */
	name: string;
	version?: string;

	/** Allow this entity to be replaced at runtime */
	replaceable?: boolean;

	/** Array of EntityReference's this Entity depends on */
	dependencies?: Array<EntityReference<Entity>>;

	/** Parent EntityReference this Entity depends on */
	parent?: EntityReference<Entity>;

	// General Lifecycle events

	/** Lifecycle: Called right before Entity is fully loaded */
	onLoad?(api?: EntityAPI): Promise<unknown>;
	/** Lifecycle: Called right before Entity is unloaded */
	onUnload?(): Promise<unknown>;

	/** Lifecycle: Called indirectly by `bento.verify()` */
	onVerify?(): Promise<unknown>;

	// Parent lifecycle events

	/** Lifecycle: Called when a self-designated child has loaded */
	onChildLoad?(child: Entity): Promise<unknown>;

	/** Lifecycle: Called when a self-desginated child has unloaded */
	onChildUnload?(child: Entity): Promise<unknown>;
}
