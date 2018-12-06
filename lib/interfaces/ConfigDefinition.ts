'use strict';

import { ConfigDefinitionType } from './ConfigDefinitionType';

export interface ConfigDefinition {
	type: ConfigDefinitionType;
	name: string;
	env?: string;
	file?: string;
	value?: any;
}
