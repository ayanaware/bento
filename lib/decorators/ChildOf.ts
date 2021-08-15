import { EntityReference } from '../entities/types/EntityReference';
import { InstanceType } from '../types/InstanceType';

const CHILDOF_KEY = '@ayanaware/bento:ChildOf';

// eslint-disable-next-line @typescript-eslint/ban-types
export function getChildOf(target: Function): InstanceType<unknown> {
	const childOf = Reflect.getMetadata(CHILDOF_KEY, target) as InstanceType<unknown>;
	if (!childOf) return null;

	return childOf;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export function ChildOf(reference: EntityReference): ClassDecorator {
	return (target: any) => {
		if (!reference) throw new Error('ChildOf(): EntityReference not provided');

		Reflect.defineMetadata(CHILDOF_KEY, reference, target);
	};
}
