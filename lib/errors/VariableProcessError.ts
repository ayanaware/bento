'use strict';

import { AyanaError, GlobalInstanceOf } from '@ayana/errors';

import { Plugin, VariableDefinition } from '../interfaces';

@GlobalInstanceOf('@ayana/components', '1')
export class VariableProcessError extends AyanaError {
	public readonly plugin: Plugin;

	constructor(componentName: string, variableDefinition: VariableDefinition, msg: string) {
		super(`Component "${componentName}", Variable "${variableDefinition.name}": ${msg}`);

		this.define('definition', variableDefinition);
	}
}
