'use strict';

const assert = require('assert');

const { Bento } = require('../../build');

describe('#getMissingDependencies', function () {
	it('should return an array', function () {
		const bento = new Bento();

		assert.strictEqual(
			Array.isArray(bento.getMissingDependencies({ name: 'TestComponent' })),
			true, 'Did not return an array'
		);
	});

	it('should return a list of components not currently loaded, requested by provided component', function () {
		const bento = new Bento();

		bento.primary.set('A', {});
		bento.primary.set('B', {});

		const missing = bento.getMissingDependencies({
			name: 'TestComponent',
			dependencies: ['A', 'B', 'C', 'D'],
		});

		assert.strictEqual(
			missing.length === 2 && missing.indexOf('C') > -1 && missing.indexOf('D') > -1,
			true, 'Unexpected return from getMissingDependencies',
		);
	});
});
