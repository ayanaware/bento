'use strict';

import { VariableDefinition } from '../VariableDefinition';

export interface DecoratorVariable {
	propertyKey: string;
	definition: VariableDefinition;
}
