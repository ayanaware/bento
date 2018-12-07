'use strict';

const assert = require('assert');

const { ComponentManager } = require('../../../../build/managers/ComponentManager');

describe('#getMissingDependencies', function () {
	it('should return an array', function () {
		const manager = new ComponentManager();

		assert.strictEqual(
			Array.isArray(manager.getMissingDependencies([])),
			true, 'Did not return an array'
		);
	});

	it('should return a list of components not currently loaded, requested by provided component', function () {
		const manager = new ComponentManager();

		manager.components.set('A', {});
		manager.components.set('B', {});

		const missing = manager.getMissingDependencies(['A', 'B', 'C', 'D']);

		assert.strictEqual(
			missing.length === 2 && missing.indexOf('C') > -1 && missing.indexOf('D') > -1,
			true, 'Unexpected return from getMissingDependencies',
		);
	});
});
