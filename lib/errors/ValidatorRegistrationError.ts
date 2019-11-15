
import { AyanaError, GlobalInstanceOf } from '@ayana/errors';

@GlobalInstanceOf('@ayanaware/bento', '1')
export class ValidatorRegistrationError extends AyanaError {
	public readonly validator: string;

	public constructor(validator: string, msg: string) {
		super(msg);

		this.__define('validator', validator);
	}
}
