import { BentoError } from './BentoError';

export class ValidatorRegistrationError extends BentoError {
	public readonly validator: string;

	public constructor(validator: string, msg: string) {
		super(msg);

		this.__define('validator', validator);
	}
}
