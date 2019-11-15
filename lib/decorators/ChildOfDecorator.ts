import { ComponentReference } from '../references';

export const CHILDOF_DECORATOR_SYMBOL = Symbol('childOfDecorator');

export interface ChildOfDecoratorInjection {
	reference: ComponentReference;
}

export function getChildOfDecoratorInjection(target: any): ChildOfDecoratorInjection {
	if (target.constructor == null) return null;

	return target.constructor[CHILDOF_DECORATOR_SYMBOL] || null;
}

export function ChildOf(reference: ComponentReference): ClassDecorator {
	return function(target: any) {
		if (target.prototype !== undefined) throw new Error(`"${target.name}": @ChildOf can only be applied to non-static classes`);

		if (target.constructor[CHILDOF_DECORATOR_SYMBOL] != null) throw new Error(`"${target.name}": @ChildOf can only be applied once`);

		target.constructor[CHILDOF_DECORATOR_SYMBOL] = {
			reference,
		};
	};
}
