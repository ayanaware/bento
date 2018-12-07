'use strict';

const assert = require('assert');

const { Bento } = require('../../../build');

describe('#resolveDependencies', function () {
	it('should resolve any component references down to their name', function () {
		const bento = new Bento();

		assert.deepStrictEqual(
			bento.resolveDependencies([{ name: 'TestComponent' }]),
			['TestComponent'], 'Failed to resolve object component name'
		);
	});
});
