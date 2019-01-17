'use strict';

// make unexpected instance available globally
const expect = require('./unexpected');
global.expect = expect;

// add runTests helper function
require('./runTests');

// 👌
// If this does not pass. God help you!
it('assert sanity of current universe', function () {
	expect(1 + 1, 'to be', 2);
	expect(1 - 1, 'to be', 0);
});

// Require everything for proper test coverage
require('../build');

require('./unit');
