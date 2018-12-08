'use strict';

const fs = require('fs');
const path = require('path');

global.runTests = function () {
	const pst = Error.prepareStackTrace;
	Error.prepareStackTrace = (e, stk) => {
		Error.prepareStackTrace = pst;
		return stk;
	};

	// Get caller file from stack
	const stack = new Error().stack;

	const callerDir = path.dirname(stack[1].getFileName());

	const dirList = fs.readdirSync(callerDir);
	const runners = [];

	for (const item of dirList) {
		if (item !== 'index.js' && !item.startsWith('_')) {
			runners.push(path.resolve(callerDir, item));
		}
	}

	for (const runner of runners) {
		require(runner);
	}
};
