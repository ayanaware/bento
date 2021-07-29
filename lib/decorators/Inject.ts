import { IllegalAccessError, IllegalArgumentError } from '@ayanaware/errors';

import { EntityReference } from '../entities/types/EntityReference';

const INJECT_KEY = '@ayanaware/bento:Inject';

export interface Injections {
	key: string | symbol;
	reference: EntityReference;
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function getInjections(target: Function): Array<Injections> {
	const injections = Reflect.getMetadata(INJECT_KEY, target) as Array<Injections>;
	if (!Array.isArray(injections)) return [];

	return injections;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export function Inject(reference?: EntityReference): PropertyDecorator {
	return (target: any, propertyKey: string | symbol, parameterIndex?: number) => {
		if (typeof parameterIndex === 'number' && propertyKey != null) {
			throw new IllegalAccessError('Inject(): cannot be used on method parameters outside of constructor');
		}

		// If no reference, attempt infer from Typescript
		if (!reference && propertyKey) {
			reference = Reflect.getMetadata('design:type', target, propertyKey) as EntityReference;

			// TODO: verify valid
		}

		if (!reference) throw new IllegalArgumentError('Inject(): Reference not provided and cannot be inferred from Typescript');

		const injections = Reflect.getMetadata(INJECT_KEY, target) as Array<Injections> || [];
		injections.push({ key: propertyKey, reference });

		Reflect.defineMetadata(INJECT_KEY, injections, target);
	};
}
