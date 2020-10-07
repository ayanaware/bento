import { EntityReference } from '../entities';

export const INJECT_DECORATOR_SYMBOL = Symbol('injectDecorator');

export interface InjectDecoratorInjection {
	propertyKey: string;
	reference: EntityReference;
}

export function getInjectDecoratorInjections(target: any): Array<InjectDecoratorInjection> {
	if (target.constructor == null) return [];

	const injections: Array<InjectDecoratorInjection> = target.constructor[INJECT_DECORATOR_SYMBOL];
	if (!Array.isArray(injections)) return [];

	return injections;
}

export function Inject(reference: EntityReference): PropertyDecorator {
	return function(target: any, propertyKey: string | symbol) {
		if (target.prototype !== undefined) throw new Error(`"${target.name}#${String(propertyKey)}": @Inject can only be applied to non-static properties`);

		if (target.constructor[INJECT_DECORATOR_SYMBOL] == null) {
			Object.defineProperty(target.constructor, INJECT_DECORATOR_SYMBOL, {
				configurable: false,
				enumerable: false,
				writable: false,
				value: [],
			});
		}

		target.constructor[INJECT_DECORATOR_SYMBOL].push({
			propertyKey,
			reference,
		} as InjectDecoratorInjection);
	};
}
