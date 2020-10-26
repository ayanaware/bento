import { IllegalAccessError, IllegalArgumentError } from '@ayanaware/errors';

import { EntityReference } from '../entities';
import { MetadataSymbols } from './internal';

export interface Injections {
	key: string | symbol;
	reference: EntityReference;
}

export function getInjections(target: any): Array<Injections> {
	const injections: Array<Injections> = Reflect.getMetadata(MetadataSymbols.INJECT, target.constructor) || [];
	if (!Array.isArray(injections)) return [];

	return injections;
}

export function Inject(reference?: EntityReference): PropertyDecorator {
	return function(target: any, propertyKey: string | symbol, parameterIndex?: number) {
		let constructor = target;
		if (constructor.prototype === undefined) constructor = constructor.constructor;

		if (typeof parameterIndex === 'number' && propertyKey != null) throw new IllegalAccessError('Inject(): cannot be used on method parameters outside of constructor');

		// If no reference, attempt infer from Typescript
		if (!reference && propertyKey) {
			reference = Reflect.getMetadata('design:type', target, propertyKey);

			// TODO: verify valid
		}

		if (!reference) throw new IllegalArgumentError(`Inject(): Reference not provided and cannot be inferred from Typescript`);

		const injections: Array<Injections> = Reflect.getMetadata(MetadataSymbols.INJECT, constructor) || [];

		injections.push({ key: propertyKey, reference });

		Reflect.defineMetadata(MetadataSymbols.INJECT, injections, constructor);
	};
}
