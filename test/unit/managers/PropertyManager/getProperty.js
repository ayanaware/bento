'use strict';

const expect = require('../../../unexpected');

const { PropertyManager } = require('../../../../build/managers/PropertyManager');

describe('#getProperty', function () {
	const getClean = () => {
		const tested = new PropertyManager({});

		return tested;
	};

	it('should throw an error when property name is not a string', function () {
		const tested = getClean();

		expect(
			() => tested.getProperty(null),
			'to throw',
			'Property name must be a string'
		);
	});

	it('should get a property', function () {
		const tested = getClean();

		tested.properties.set('test', 'stuff');

		expect(
			tested.getProperty('test'),
			'to be',
			'stuff'
		);
	});
});
