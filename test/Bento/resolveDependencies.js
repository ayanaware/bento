'use strict';

const assert = require('assert');

const { Bento } = require('../../build');

describe('#resolveDependencies', function () {
	it('should throw an error if dependencies is not an array', function () {
		const bento = new Bento();

		assert.throws(
			() => bento.resolveDependencies(null),
			{ message: 'Dependencies is not an array' }
		);
	});

	it('should resolve any component references down to their name', function () {
		const bento = new Bento();

		assert.deepStrictEqual(
			bento.resolveDependencies([{ name: 'TestComponent' }]),
			['TestComponent'], 'Failed to resolve object component name'
		);
	});
});
