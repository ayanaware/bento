'use strict';

import { VariableDefinitionValidator } from './VariableDefinitionValidator';

export interface VariableDefinition {
	name: string;
	default?: any;
	required?: boolean;
	validator?: VariableDefinitionValidator;
}
