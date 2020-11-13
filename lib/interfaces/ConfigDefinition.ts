export enum ConfigDefinitionType {
	STRING = 'string',
	NUMBER = 'number',
	BOOLEAN = 'boolean',
	LIST = 'list',
}

export interface ConfigDefinition {
	type: ConfigDefinitionType;
	name: string;
	env?: string;
	file?: string;
	value?: any;
}
