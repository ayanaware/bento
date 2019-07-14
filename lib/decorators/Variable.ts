
import { VariableDefinition } from '../variables';

import { DecoratorSymbols, DecoratorVariable } from './internal';

export function Variable(definition: VariableDefinition): PropertyDecorator {
	return function(target: any, propertyKey: string | symbol) {
		if (target.prototype !== undefined) {
			throw new Error(`The variable decorator can only be applied to non-static class properties ("${String(propertyKey)}" in class "${target.name}")`);
		}

		if (target.constructor[DecoratorSymbols.variables] == null) {
			Object.defineProperty(target.constructor, DecoratorSymbols.variables, {
				configurable: false,
				enumerable: false,
				writable: false,
				value: [],
			});
		}

		target.constructor[DecoratorSymbols.variables].push({
			propertyKey,
			definition,
		} as DecoratorVariable);
	};
}
