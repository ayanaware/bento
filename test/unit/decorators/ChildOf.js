'use strict';

const expect = require('unexpected');

const { Symbols } = require('../../../build/constants/internal/Symbols');

const {
	ChildOf: childOf,
} = require('../../../build/decorators/ChildOf');

describe('Subscribe', function () {
	it('should define a the "child of" symbol with the given component if not yet defined', function () {
		class SomeClass {}

		childOf('SomeTestParent')(SomeClass);

		expect(
			SomeClass[Symbols.childOf],
			'to be',
			'SomeTestParent'
		);
	});

	it('should not attempt to redefine the "child of" symbol', function () {
		class SomeClass {}

		childOf('SomeTestParent')(SomeClass);

		childOf('SomeOtherTestParent')(SomeClass);

		expect(
			SomeClass[Symbols.childOf],
			'to be',
			'SomeTestParent'
		);
	});
});
