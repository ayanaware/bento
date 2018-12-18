'use strict';

const assert = require('assert');

require('./assertions');
require('./runTests');

// 👌
// If this does not pass. God help you!
it('assert sanity of current universe', function () {
	assert.strictEqual(2, 1 + 1);
	assert.strictEqual(0, 1 - 1);
});

// Require everything for proper test coverage
require('../build');

require('./unit');
