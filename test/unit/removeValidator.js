'use strict';

const assert = require('assert');

const { Bento } = require('../../build');

describe('#removeValidator', function () {
	it('should throw an error if validator name is not a string', function () {
		const bento = new Bento();

		assert.throws(
			() => bento.removeValidator(null),
			{ message: 'Validator name must be a string' },
		);
	});

	it('should throw an error if validator does not exist', function () {
		const bento = new Bento();

		assert.throws(
			() => bento.removeValidator('testValidator'),
			{ message: 'Validator "testValidator" does not exist' },
		);
	});
});
