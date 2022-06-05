'use strict';

// @fs-entity
class CauseError {
	constructor() {
		this.name = 'CauseError';
	}

	async onLoad() {
		// throw new Error('Hello from CauseError!');
	}
}

module.exports = CauseError;
