'use strict';

import { Symbols } from '../constants/internal';
import { VariableDefinition } from '../interfaces';
import { DecoratorVariable } from '../interfaces/internal';

export function Variable(definition: VariableDefinition & { property?: never }): PropertyDecorator {
	return function(target: any, propertyKey: string | symbol) {
		if(target.prototype !== undefined) {
			throw new Error(`The variable decorator can only be applied to non-static class properties ("${String(propertyKey)}" in class "${target.name}")`);
		}

		if (target.constructor[Symbols.variables] == null) {
			Object.defineProperty(target.constructor, Symbols.variables, {
				configurable: false,
				enumerable: false,
				writable: false,
				value: [],
			});
		}

		target.constructor[Symbols.variables].push({
			propertyKey,
			definition,
		} as DecoratorVariable);
	};
}
