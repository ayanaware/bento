'use strict';

const expect = require('unexpected');

const { PropertyManager } = require('../../../../build/managers/PropertyManager');

describe('#hasProperty', function () {
	const getClean = () => {
		const tested = new PropertyManager({});

		return tested;
	};

	it('should throw an error when the property name is not a string', function () {
		const tested = getClean();

		expect(
			() => tested.hasProperty(null),
			'to throw',
			'Property name must be a string'
		);
	});

	it('should return true if the property exists', function () {
		const tested = getClean();

		tested.properties.set('test', 'stuff');

		expect(
			tested.hasProperty('test'),
			'to be true'
		);
	});

	it('should return false if the property does not exist', function () {
		const tested = getClean();

		expect(
			tested.hasProperty('test'),
			'to be false'
		);
	});
});
