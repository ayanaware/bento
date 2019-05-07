'use strict';

import { DecoratorInjection, DecoratorSymbols } from './internal';

import { ComponentReference } from '../references';

export function Inject(component: ComponentReference): PropertyDecorator {
	return function(target: any, propertyKey: string) {
		if(target.prototype !== undefined) {
			throw new Error(`The inject decorator can only be applied to non-static class properties ("${propertyKey}" in class "${target.name}")`);
		}

		if (target.constructor[DecoratorSymbols.injections] == null) {
			Object.defineProperty(target.constructor, DecoratorSymbols.injections, {
				configurable: false,
				enumerable: false,
				writable: false,
				value: [],
			});
		}

		if (typeof component === 'symbol') {
			target.constructor[DecoratorSymbols.injections].push({
				propertyKey,
				symbol: component,
			} as DecoratorInjection);
		} else {
			target.constructor[DecoratorSymbols.injections].push({
				propertyKey,
				component,
			} as DecoratorInjection);
		}
	};
}

export function Parent(): PropertyDecorator {
	return function(target: any, propertyKey: string) {
		if(target.prototype !== undefined) {
			throw new Error(`The parent decorator can only be applied to non-static class methods ("${propertyKey}" in class "${target.name}")`);
		}

		return Inject(DecoratorSymbols.parent as any)(target, propertyKey);
	};
}
