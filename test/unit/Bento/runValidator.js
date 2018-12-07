'use strict';

const assert = require('assert');

const { Bento } = require('../../../build');

describe('#runValidator', function () {
	it('should throw an error if validator name is not a string', function () {
		const bento = new Bento();

		assert.throws(
			() => bento.runValidator(null),
			{ message: 'Validator name must be a string' },
		);
	});

	it('should throw an error if validator does not exist', function () {
		const bento = new Bento();

		assert.throws(
			() => bento.runValidator('testValidator'),
			{ message: 'Validator "testValidator" does not exist' },
		);
	});

	it('should attempt to call validator', function () {
		const bento = new Bento();

		let attempted = false;
		bento.addValidator('testValidator', () => {
			attempted = true;
		});

		bento.runValidator('testValidator');

		assert.strictEqual(attempted, true, 'Validator was not called');
	});

	it('should throw an error if validator throws an error', function () {
		const bento = new Bento();

		bento.addValidator('testValidator', () => {
			throw new Error('👌');
		});

		assert.throws(
			() => bento.runValidator('testValidator'),
			{ message: `Validator "testValidator" failed to execute` },
		);
	});
});
