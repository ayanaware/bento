'use strict';

import { ComponentVariableDefinition } from '../ComponentVariableDefinition';

export interface DecoratorVariable {
	propertyKey: string;
	definition: ComponentVariableDefinition;
}
