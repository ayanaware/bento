'use strict';

const { PropertyManager } = require('../../../../build/managers/PropertyManager');

describe('#setProperty', function () {
	const getClean = () => {
		const tested = new PropertyManager({});

		return tested;
	};

	it('should throw an error when the property name is not a string', function () {
		const tested = getClean();

		expect(
			() => tested.setProperty(null, 'something'),
			'to throw',
			'Property name must be a string'
		);
	});

	it('should add a property', function () {
		const tested = getClean();

		tested.setProperty('test', 'stuff');

		expect(
			tested.properties.get('test'),
			'to be',
			'stuff'
		);
	});
});
