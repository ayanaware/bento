'use strict';

import { VariableDefinitionValidator } from './VariableDefinitionValidator';

export interface VariableDefinition {
	type: string;
	name: string;
	default?: any;
	required?: boolean;
	validator?: VariableDefinitionValidator;
}
