'use strict';

const assert = require('assert');

const { ComponentManager } = require('../../../../build/managers/ComponentManager');

describe('#resolveDependencies', function () {
	const getCleanComponentManager = () => {
		const manager = new ComponentManager({});

		return manager;
	};

	it('should resolve any component references down to their name', function () {
		const bento = getCleanComponentManager();

		assert.deepStrictEqual(
			bento.resolveDependencies([{ name: 'TestComponent' }]),
			['TestComponent'], 'Failed to resolve object component name'
		);
	});
});
