'use strict';

const { Bento } = require('../../../../build/Bento');

describe('#addValidator', function() {
	it('should throw an error if validator name is not a string', function() {
		const bento = new Bento();

		assert.throws(
			() => bento.addValidator(null),
			{ message: 'Validator name must be a string' },
		);
	});

	it('should throw an error if validator is not a function', function() {
		const bento = new Bento();

		assert.throws(
			() => bento.addValidator('testValidator', null),
			{ message: 'Validator must be a function' },
		);
	});
});
