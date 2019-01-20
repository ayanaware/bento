'use strict';

const { Symbols } = require('../../../build/constants/internal/Symbols');

const {
	Variable: variable,
} = require('../../../build/decorators/Variable');

describe('Variable', function() {
	it('should throw an error if the target has a prototype', function() {
		class SomeClass {}

		expect(
			() => variable()(SomeClass, 'somePropertyKey'),
			'to throw',
			'The variable decorator can only be applied to non-static class properties ("somePropertyKey" in class "SomeClass")'
		);
	});

	it('should define a new array on the variables symbol if it does not exist', function() {
		const object = new class SomeClass {}();

		variable()(object);

		expect(
			object.constructor[Symbols.variables],
			'to be an array'
		);
	});

	it('should not redefine the variables array', function() {
		const object = new class SomeClass {}();

		variable()(object);

		const definedArray = object.constructor[Symbols.variables];

		variable()(object);

		expect(
			object.constructor[Symbols.variables],
			'to be',
			definedArray
		);
	});

	it('should push the given data into the array', function() {
		const properties = {
			propertyKey: 'somePropertyKey',
			definition: {},
		};

		const object = new class SomeClass {}();

		variable(properties.definition)(object, properties.propertyKey);

		expect(
			object.constructor[Symbols.variables][0],
			'to have own properties',
			properties
		);
	});
});
