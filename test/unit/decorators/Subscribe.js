'use strict';

const { Symbols } = require('../../../build/constants/internal/Symbols');
const { SubscriptionType } = require('../../../build/constants/SubscriptionType');

const {
	Subscribe: subscribe,
} = require('../../../build/decorators/Subscribe');

describe('Subscribe', function() {
	it('should throw an error if the target has a prototype', function() {
		class SomeClass {}

		expect(
			() => subscribe()(SomeClass, 'somePropertyKey'),
			'to throw',
			'The subscribe decorator can only be applied to non-static class methods ("somePropertyKey" in class "SomeClass")'
		);
	});

	it('should define a new array on the subscriptions symbol if it does not exist', function() {
		const object = new class SomeClass {}();

		subscribe()(object, null, {});

		expect(
			object.constructor[Symbols.subscriptions],
			'to be an array'
		);
	});

	it('should not redefine the subscription array', function() {
		const object = new class SomeClass {}();

		subscribe()(object, null, {});

		const definedArray = object.constructor[Symbols.subscriptions];

		subscribe()(object, null, {});

		expect(
			object.constructor[Symbols.subscriptions],
			'to be',
			definedArray
		);
	});

	it('should push the given data into the array', function() {
		const properties = {
			type: 'SomeType',
			namespace: 'SomeNamespace',
			name: 'SomeName',
			handler: function() {},
		};

		const object = new class SomeClass {}();

		subscribe(properties.type, properties.namespace, properties.name)(object, null, { value: properties.handler });

		expect(
			object.constructor[Symbols.subscriptions][0],
			'to have own properties',
			properties
		);
	});
});
