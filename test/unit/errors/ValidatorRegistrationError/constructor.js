'use strict';

const expect = require('../../../unexpected');

const { ValidatorRegistrationError } = require('../../../../build/errors/ValidatorRegistrationError');

describe('#constructor', function () {
	it('should accept a validator string and set it', function () {
		const tested = new ValidatorRegistrationError('Some validator');

		expect(
			tested.validator,
			'to be',
			'Some validator',
		);
	});

	it('should accept a custom message', function () {
		const tested = new ValidatorRegistrationError(null, 'Some message');

		expect(
			tested.message,
			'to be',
			'Some message'
		);
	});
});
