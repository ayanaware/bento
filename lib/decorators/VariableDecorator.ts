import { VariableDefinition } from '../variables';

export const VARIABLE_DECORATOR_SYMBOL = Symbol('variableDecorator');

export interface VariableDecoratorInjection {
	propertyKey: string;
	definition: VariableDefinition;
}

export function getVariableDecoratorInjections(target: any): Array<VariableDecoratorInjection> {
	if (target.constructor == null) return [];

	const injections: Array<VariableDecoratorInjection> = target.constructor[VARIABLE_DECORATOR_SYMBOL];
	if (!Array.isArray(injections)) return [];

	return injections;
}

export function Variable(definition: VariableDefinition): PropertyDecorator {
	return function(target: any, propertyKey: string | symbol) {
		if (target.prototype !== undefined) throw new Error(`"${target.name}#${String(propertyKey)}": Variable can only be applied to non-static properties`);

		if (target.constructor[VARIABLE_DECORATOR_SYMBOL] == null) {
			Object.defineProperty(target.constructor, VARIABLE_DECORATOR_SYMBOL, {
				configurable: false,
				enumerable: false,
				writable: false,
				value: [],
			});
		}

		target.constructor[VARIABLE_DECORATOR_SYMBOL].push({
			propertyKey,
			definition,
		} as VariableDecoratorInjection);
	};
}
