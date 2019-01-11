'use strict';

const unexpected = require('unexpected');
const expect = unexpected.clone();

expect.addAssertion(
	'<any> [not] to be an array',
	function (expect, subject) {
		expect(Array.isArray(subject), '[not] to be true');
	}
);

module.exports = expect;
