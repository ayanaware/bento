'use strict';

const expect = require('unexpected');

const { VariableProcessingError } = require('../../../../build/errors/VariableProcessingError');

describe('#constructor', function () {
	it('should use the input parameters to format a message', function () {
		const tested = new VariableProcessingError('TestComponent', { name: 'TestVariable' }, 'Some custom message');

		expect(
			tested.message,
			'to be',
			'Component "TestComponent", Variable "TestVariable": Some custom message'
		);
	});

	it('should define the given definition', function () {
		const definition = { some: 'definition' };

		const tested = new VariableProcessingError(null, definition);

		expect(
			tested.definition,
			'to be',
			definition,
		);
	});
});
