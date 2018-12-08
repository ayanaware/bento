'use strict';

const expect = require('unexpected');

expect.addAssertion(
	'<any> [not] to be an array',
	function (expect, subject) {
		expect(Array.isArray(subject), '[not] to be true');
	}
);
