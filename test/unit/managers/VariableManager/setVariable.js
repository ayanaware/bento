'use strict';

const assert = require('assert');

const { Bento } = require('../../../../build');

describe('#setVariable', function () {
	it('should set a variable', function () {
		const bento = new Bento();

		bento.setVariable('test', 'stuff');

		assert.strictEqual(bento.variables.get('test'), 'stuff');
	});

	it('should fail when variable name is not a string', function () {
		const bento = new Bento();

		assert.throws(
			() => bento.setVariable(null, 'stuff'),
			{ message: 'Variable name must be a string' },
		);
	});
});
