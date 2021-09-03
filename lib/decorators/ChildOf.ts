import { Entity } from '../entities/interfaces/Entity';
import { EntityReference } from '../entities/types/EntityReference';
import { InstanceType } from '../types/InstanceType';

const CHILDOF_KEY = '@ayanaware/bento:ChildOf';

// eslint-disable-next-line @typescript-eslint/ban-types
export function getChildOf(target: Function): InstanceType<Entity> {
	const childOf = Reflect.getMetadata(CHILDOF_KEY, target) as InstanceType<Entity>;
	if (!childOf) return null;

	return childOf;
}

export function ChildOf(reference: EntityReference): ClassDecorator {
	return (target: any) => {
		if (!reference) throw new Error('ChildOf(): EntityReference not provided');

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
		if (target.prototype === undefined) target = target.constructor;

		Reflect.defineMetadata(CHILDOF_KEY, reference, target);
	};
}
