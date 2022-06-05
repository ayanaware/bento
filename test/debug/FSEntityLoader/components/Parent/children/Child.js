'use strict';

const Parent = require('../Parent');

// @fs-entity
class Child {
	constructor() {
		this.name = 'Child';
		this.parent = Parent;
	}

	async onLoad() {
		// throw new Error('Hello from Parent!');
		console.log(`Hello from ${this.name}`);
	}
}

module.exports = Child;
