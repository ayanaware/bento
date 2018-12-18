'use strict';

import { Symbols } from '../constants/internal';
import { DecoratorInjection } from '../interfaces/internal';

export function Inject(component: string | Function): PropertyDecorator {
	return function (target: any, propertyKey: string) {
		if(target.prototype !== undefined) {
			throw new Error(`The inject decorator can only be applied to non-static class methods ("${propertyKey}" in class "${target.name}")`);
		}

		if (target.constructor[Symbols.injections] == null) {
			Object.defineProperty(target.constructor, Symbols.injections, {
				configurable: false,
				enumerable: false,
				writable: false,
				value: [],
			});
		}

		target.constructor[Symbols.injections].push({
			propertyKey,
			component,
		} as DecoratorInjection);
	};
}

export function Parent(): PropertyDecorator {
	return function (target: any, propertyKey: string) {
		if(target.prototype !== undefined) {
			throw new Error(`The parent decorator can only be applied to non-static class methods ("${propertyKey}" in class "${target.name}")`);
		}

		return Inject(Symbols.parent as any)(target, propertyKey);
	};
}
