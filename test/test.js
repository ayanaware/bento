'use strict';

const assert = require('assert');

global.expectErrorMessage = msg => {
	return e => {
		assert.equal(e.message, msg);
		return true;
	};
};

// 👌
it('assert sanity of current universe', function () {
	assert.equal(2, 1 + 1);
	assert.equal(0, 1 - 1);
});

require('./Bento');
