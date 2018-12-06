'use strict';

import { VariableDefinitionType } from './VariableDefinitionType';
import { VariableDefinitionValidator } from './VariableDefinitionValidator';

export interface VariableDefinition {
	name: string;
	type?: VariableDefinitionType;
	default?: any;
	validator?: VariableDefinitionValidator;
}
