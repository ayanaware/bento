'use strict';

const assert = require('assert');

const { Bento } = require('../../../../build');

describe('#getVariable', function () {
	it('should get a variable', function () {
		const bento = new Bento();

		bento.variables.set('test', 'stuff');

		assert.strictEqual(bento.getVariable('test'), 'stuff');
	});

	it('should fail when variable name is not a string', function () {
		const bento = new Bento();

		assert.throws(
			() => bento.getVariable(null),
			{ message: 'Variable name must be a string' },
		);
	});
});
