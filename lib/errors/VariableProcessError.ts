'use strict';

import { AyanaError, GlobalInstanceOf } from '@ayana/errors';

import { ComponentVariableDefinition, Plugin } from '../interfaces';

@GlobalInstanceOf('@ayana/components', '1')
export class VariableProcessError extends AyanaError {
	public readonly plugin: Plugin;

	constructor(componentName: string, definition: ComponentVariableDefinition, msg: string) {
		super(`Component "${componentName}", Variable "${definition.name}": ${msg}`);

		this.define('definition', definition);
	}
}
