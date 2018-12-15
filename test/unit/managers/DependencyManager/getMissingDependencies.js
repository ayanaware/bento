'use strict';

const expect = require('unexpected');
const sinon = require('sinon');

const { DependencyManager } = require('../../../../build/managers/DependencyManager');

describe('#getMissingDependencies', function () {
	const getClean = () => {
		const tested = new DependencyManager();

		tested.resolveDependencies = sinon.fake.returns([]);

		return tested;
	};

	it('should throw an error if no array is passed', function () {
		expect(
			() => getClean().getMissingDependencies('Totally an array'),
			'to throw',
			'Dependencies is not an array',
		);
	});

	it('should attempt to resolve the dependencies', function () {
		const tested = getClean();

		tested.resolveDependencies = sinon.fake.returns([]);

		tested.getMissingDependencies([]);

		sinon.assert.calledOnce(tested.resolveDependencies);
	});

	it('should return an array', function () {
		const tested = getClean();

		expect(
			tested.getMissingDependencies([]),
			'to be an array'
		);
	});

	it('should return a list of components not currently loaded, requested by provided component', function () {
		const tested = getClean();

		const loadedComponents = new Map();
		loadedComponents.set('A', {});
		loadedComponents.set('B', {});

		tested.resolveDependencies = sinon.fake.returns(['A', 'B', 'C', 'D']);

		const missing = tested.getMissingDependencies([], loadedComponents); // Dependencies are returned by resolveDependencies

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
