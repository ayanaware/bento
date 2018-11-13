'use strict';

import { AyanaError, GlobalInstanceOf } from '@ayana/errors';

@GlobalInstanceOf('@ayana/components', '1')
export class ValidatorRegistrationError extends AyanaError {
	public readonly validator: string;

	constructor(validator: string, msg: string) {
		super(msg);

		this.define('validator', validator);
	}
}
