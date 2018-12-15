'use strict';

const expect = require('unexpected');
const sinon = require('sinon');

const { ComponentManager } = require('../../../../build/managers/ComponentManager');

describe('#resolveDependencies', function () {
	const getClean = () => {
		const tested = new ComponentManager({});

		tested.references = {};

		tested.resolveName = sinon.fake();

		return tested;
	};

	it('should throw an error if dependencies is set but not an array', function () {
		const tested = getClean();

		expect(
			() => tested.resolveDependencies(''),
			'to throw',
			'Dependencies is not an array'
		);
	});

	it('should accept null and undefined, and return an empty array', function () {
		const tested = getClean();

		expect(
			tested.resolveDependencies(null),
			'to be an array'
		);

		expect(
			tested.resolveDependencies(undefined),
			'to be an array'
		);
	});

	it('should call the resolve function for each array item and return an array of the return values', function () {
		const tested = getClean();

		tested.resolveName = sinon.fake.returns('TestComponent');

		const result = tested.resolveDependencies(['A', {}, function () {}]);

		sinon.assert.calledThrice(tested.resolveName);

		expect(
			result,
			'to have length',
			3
		);

		expect(
			result,
			'to have items satisfying',
			'to be',
			'TestComponent'
		);
	});

	it('should throw an error if a resolve fails', function () {
		const tested = getClean();

		tested.resolveName = sinon.fake.throws(new Error('Oops'));

		expect(
			() => tested.resolveDependencies(['A']),
			'to throw',
			'Failed to resolve dependency',
		);
	});
});
