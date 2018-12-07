'use strict';

const expect = require('unexpected');
const sinon = require('sinon');

const { ComponentManager } = require('../../../../build/managers/ComponentManager');

describe('#getMissingDependencies', function () {
	const getCleanComponentManager = () => {
		const manager = new ComponentManager({});

		manager.resolveDependencies = sinon.fake.returns([]);

		return manager;
	};

	it('should throw an error if no array is passed', function () {
		expect(
			() => getCleanComponentManager().getMissingDependencies('Totally an array'),
			'to throw',
			'Dependencies is not an array',
		);
	});

	it('should attempt to resolve the dependencies', function () {
		const manager = getCleanComponentManager();

		manager.resolveDependencies = sinon.fake.returns([]);

		manager.getMissingDependencies([]);

		expect(
			manager.resolveDependencies.callCount,
			'to be',
			1
		);
	});

	it('should return an array', function () {
		const manager = getCleanComponentManager();

		expect(
			manager.getMissingDependencies([]),
			'to be an array'
		);
	});

	it.skip('should return a list of components not currently loaded, requested by provided component', function () {
		const manager = this.getCleanComponentManager();

		manager.components.set('A', {});
		manager.components.set('B', {});

		const missing = manager.getMissingDependencies(['A', 'B', 'C', 'D']);

		expect.strictEqual(
			missing.length === 2 && missing.indexOf('C') > -1 && missing.indexOf('D') > -1,
			true, 'Unexpected return from getMissingDependencies',
		);
	});
});
