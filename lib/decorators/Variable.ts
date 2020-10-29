import { VariableDefinition } from '../variables';
import { MetadataKeys } from './internal';

export interface VariableInjection {
	key: string | symbol;
	definition: VariableDefinition;
}

export function getVariables(target: any) {
	const variables: Array<VariableInjection> = Reflect.getMetadata(MetadataKeys.VARIABLE, target.constructor) || [];
	if (!Array.isArray(variables)) return [];

	return variables;
}

export function Variable(definition: VariableDefinition): PropertyDecorator {
	return (target: any, propertyKey: string | symbol) => {
		if (target.proptotype === undefined) target = target.constructor;

		const variables: Array<VariableInjection> = Reflect.getMetadata(MetadataKeys.VARIABLE, target) || [];

		variables.push({ key: propertyKey, definition });

		Reflect.defineMetadata(MetadataKeys.VARIABLE, variables, target);
	};
}
