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

		sinon.assert.calledOnce(manager.resolveDependencies);
	});

	it('should return an array', function () {
		const manager = getCleanComponentManager();

		expect(
			manager.getMissingDependencies([]),
			'to be an array'
		);
	});

	it('should return a list of components not currently loaded, requested by provided component', function () {
		const manager = getCleanComponentManager();

		manager.components.set('A', {});
		manager.components.set('B', {});

		manager.resolveDependencies = sinon.fake.returns(['A', 'B', 'C', 'D']);

		const missing = manager.getMissingDependencies([]); // Dependencies are returned by resolveDependencies

		expect(
			missing,
			'not to contain',
			'A', 'B'
		);

		expect(
			missing,
			'to contain',
			'C', 'D'
		);
	});
});
