'use strict';

import { AyanaError, GlobalInstanceOf } from '@ayana/errors';

import { VariableDefinition } from '../variables';

@GlobalInstanceOf('@ayana/bento', '1')
export class VariableProcessingError extends AyanaError {
	public readonly definition: VariableDefinition;

	constructor(componentName: string, definition: VariableDefinition, msg: string) {
		super(`Component "${componentName}", Variable "${definition.name}": ${msg}`);

		this.__define('definition', definition);
	}
}
