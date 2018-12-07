'use strict';

const assert = require('assert');

const { Bento } = require('../../build');

describe('#getProperty', function () {
	it('should get a property', function () {
		const bento = new Bento();

		bento.properties.set('test', 'stuff');

		assert.strictEqual(bento.getProperty('test'), 'stuff');
	});

	it('should fail when property name is not a string', function () {
		const bento = new Bento();
		assert.throws(
			() => bento.getProperty(null),
			{ message: 'Property name must be a string' },
		);
	});
});
