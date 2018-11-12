'use strict';

import { VariableDefinitionValidator } from './VariableDefinitionValidator';

export interface VariableDefinition {
	type: string;
	name: string;
	/**
	 * If this is set to undefined the variable is required and the component load will fail if it isn't present.
	 * If this is set to something else and the value isn't present this default value will be used.
	 */
	default?: any;
	validator?: VariableDefinitionValidator;
}
