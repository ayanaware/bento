import { EntityReference } from '../entities/types/EntityReference';

const PARENT_KEY = '@ayanaware/bento:ChildOf';

export interface ParentInjection {
	reference: EntityReference;
	propertyKey: string | symbol;
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function getParent(target: Function): ParentInjection {
	const parent = Reflect.getMetadata(PARENT_KEY, target) as ParentInjection;
	if (!parent) return null;

	return parent;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export function Parent(reference: EntityReference): PropertyDecorator {
	return (target: any, propertyKey: string | symbol) => {
		if (!reference) throw new Error('ChildOf(): EntityReference not provided');

		Reflect.defineMetadata(PARENT_KEY, { reference, propertyKey }, target);
	};
}
