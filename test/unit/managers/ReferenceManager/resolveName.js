'use strict';

const expect = require('../../../unexpected');
const sinon = require('sinon');

const { ReferenceManager } = require('../../../../build/managers/ReferenceManager');

describe('#resolveName', function () {
	const getClean = () => {
		const tested = new ReferenceManager();

		tested.resolveNameSafe = sinon.fake();

		return tested;
	};

	it('should attempt to resolve the name', function () {
		const tested = getClean();

		tested.resolveNameSafe = sinon.fake.returns('TestComponent');

		tested.resolveName();

		sinon.assert.calledOnce(tested.resolveNameSafe);
	});

	it('should throw an error when no name could be determined', function () {
		const tested = getClean();

		expect(
			() => tested.resolveName(),
			'to throw',
			'Given entity or reference is invalid, not registered or does not have a name'
		);
	});

	it('should return the resolved components name', function () {
		const tested = getClean();

		tested.resolveNameSafe = sinon.fake.returns('TestComponent');

		expect(
			tested.resolveName(), // Name is given by resolveNameSafe
			'to be',
			'TestComponent'
		);
	});
});
