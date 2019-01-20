'use strict';

require('@ayana/test');

// 👌
// If this does not pass. God help you!
it('assert sanity of current universe', function() {
	expect(1 + 1, 'to be', 2);
	expect(1 - 1, 'to be', 0);
});

// Require everything for proper test coverage
require('../build');

require('./unit');
