export const PARENT_DECORATOR_SYMBOL = Symbol('parentDecorator');

export interface ParentDecoratorInjection {
	propertyKey: string;
}

export function getParentDecoratorInjection(target: any): ParentDecoratorInjection {
	if (target.constructor == null) return null;

	return target.constructor[PARENT_DECORATOR_SYMBOL] || null;
}

export function Parent(): PropertyDecorator {
	return function(target: any, propertyKey: string | symbol) {
		if (target.prototype !== undefined) throw new Error(`"${target.name}#${String(propertyKey)}": @Parent can only be applied to non-static methods`);

		if (target.constructor[PARENT_DECORATOR_SYMBOL] != null) throw new Error(`"${target.name}": @Parent Decorator can only be applied once`);

		target.constructor[PARENT_DECORATOR_SYMBOL] = {
			propertyKey,
		};
	};
}
