'use strict';

const expect = require('unexpected');

const { Symbols } = require('../../../build/constants/internal/Symbols');

const {
	Inject: inject,
	Parent: parent,
} = require('../../../build/decorators/Inject');

describe('Subscribe', function () {
	it('should throw an error if the target has no prototype', function () {
		class SomeClass {}

		expect(
			() => inject()(SomeClass, 'somePropertyKey'),
			'to throw',
			'The inject decorator can only be applied to non-static class methods ("somePropertyKey" in class "SomeClass")'
		);
	});

	it('should define a new array on the ubhectuibs symbol if it does not exist', function () {
		const object = new class SomeClass {}();

		inject()(object, null, {});

		expect(
			object.constructor[Symbols.injections],
			'to be an array'
		);
	});

	it('should not redefine the injections array', function () {
		const object = new class SomeClass {}();

		inject()(object, null, {});

		const definedArray = object.constructor[Symbols.injections];

		inject()(object, null, {});

		expect(
			object.constructor[Symbols.injections],
			'to be',
			definedArray
		);
	});

	it('should push the given data into the array', function () {
		const properties = {
			propertyKey: 'somePropertyKey',
			component: function () {},
		};

		const object = new class SomeClass {}();

		inject(properties.component)(object, properties.propertyKey);

		expect(
			object.constructor[Symbols.injections][0],
			'to have own properties',
			properties
		);
	});
});

describe('Parent', function () {
	it('should throw an error if the target has no prototype', function () {
		class SomeClass {}

		expect(
			() => parent()(SomeClass, 'somePropertyKey'),
			'to throw',
			'The parent decorator can only be applied to non-static class methods ("somePropertyKey" in class "SomeClass")'
		);
	});

	it('should create an injection with the parent symbol', function () {
		const object = new class SomeClass {}();

		parent()(object, null, {});

		expect(
			object.constructor[Symbols.injections][0].component,
			'to be',
			Symbols.parent
		);
	});
});
