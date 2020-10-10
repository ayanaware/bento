'use strict';

class ClassModule {
	constructor() {
		this.name = 'ClassModule';
	}

	async onLoad() {
		console.log('Hello from FSComponentLoader');
	}
}

module.exports = ClassModule;
