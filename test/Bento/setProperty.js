'use strict';

const assert = require('assert');

const { Bento } = require('../../build');

describe('#setProperty', function () {
	it('should add a property', function () {
		const bento = new Bento();

		bento.setProperty('test', 'stuff');

		assert.equal(bento.properties.get('test'), 'stuff');
	});

	it('should fail when the property name is not a string', function () {
		const bento = new Bento();

		assert.throws(
			() => bento.setProperty(null, 'something'),
			expectErrorMessage('Property name must be a string'),
		);
	});
});
