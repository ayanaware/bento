import { VariableDefinition } from '../variables/interfaces/VariableDefinition';

const VARIABLE_KEY = '@ayanaware/bento:Variable';

export interface Variables {
	key: string | symbol;
	definition: VariableDefinition;
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function getVariables(target: Function): Array<Variables> {
	const variables: Array<Variables> = Reflect.getMetadata(VARIABLE_KEY, target) as Array<Variables>;
	if (!Array.isArray(variables)) return [];

	return variables;
}

export function Variable(definition: VariableDefinition): PropertyDecorator {
	return (target: any, propertyKey: string | symbol) => {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
		if (target.prototype === undefined) target = target.constructor;

		const variables = Reflect.getMetadata(VARIABLE_KEY, target) as Array<Variables> || [];
		variables.push({ key: propertyKey, definition });

		Reflect.defineMetadata(VARIABLE_KEY, variables, target);
	};
}
