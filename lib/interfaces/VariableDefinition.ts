'use strict';

export enum VariableDefinitionType {
	STRING = 'string',
	NUMBER = 'number',
	BOOLEAN = 'boolean',
	ARRAY = 'array',
	OBJECT = 'object',
}

export interface VariableDefinition {
	type?: VariableDefinitionType;
	name: string;
	property?: string;
	default?: any;
	validator?: string;
}
