'use strict';

import { VariableType } from './VariableType';
import { VariableValidator } from './VariableValidator';

export interface ComponentVariableDefinition {
	name: string;
	type?: VariableType;
	/**
	 * If this is set to undefined the variable is required and the component load will fail if it isn't present.
	 * If this is set to something else and the value isn't present this default value will be used.
	 */
	default?: any;
	validator?: VariableValidator;
}
