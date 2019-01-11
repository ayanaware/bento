'use strict';

const expect = require('../../../unexpected');

const { ComponentLoadError } = require('../../../../build/errors/ComponentLoadError');

describe('#constructor', function () {
	it('should use a default component location if no one is passed and set it', function () {
		const tested = new ComponentLoadError();

		expect(
			tested.componentLocation,
			'to be',
			'Unknown component location'
		);
	});

	it('should use the given component location and set it', function () {
		const tested = new ComponentLoadError('Some component location');

		expect(
			tested.componentLocation,
			'to be',
			'Some component location'
		);
	});

	it('should use a default message if no one is passed', function () {
		const tested = new ComponentLoadError();

		expect(
			tested.message,
			'to begin with',
			'Failed to load component'
		);
	});

	it('should accept a custom message', function () {
		const tested = new ComponentLoadError(null, 'Some message');

		expect(
			tested.message,
			'to begin with',
			'Some message'
		);
	});

	it('should format the message properly', function () {
		const tested = new ComponentLoadError('This location is good', 'This message is better');

		expect(
			tested.message,
			'to be',
			'This message is better: This location is good'
		);
	});
});
