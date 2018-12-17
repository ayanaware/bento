'use strict';

const expect = require('unexpected');
const sinon = require('sinon');

const { ComponentManager } = require('../../../../build/managers/ComponentManager');

describe('#getMissingDependencies', function () {
	const getClean = () => {
		const tested = new ComponentManager({});

		tested.references = {};

		tested.resolveName = sinon.fake.returns(null);

		return tested;
	};

	it('should throw an error if no array is passed', function () {
		expect(
			() => getClean().getMissingDependencies('Totally an array'),
			'to throw',
			'Dependencies is not an array',
		);
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

		tested.components.set('A', {});
		tested.components.set('B', {});

		// figure out how to use sinon for this
		tested.resolveName = name => name;

		const missing = tested.getMissingDependencies(['A', 'B', 'C', 'D']); // Dependencies are returned by resolveDependencies

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
