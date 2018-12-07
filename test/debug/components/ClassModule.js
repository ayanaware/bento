'use strict';

class ClassModule {
	constructor() {
		this.name = 'ClassModule';
	}

	async onLoad() {
		console.log('Hello from FileSystemLoader');
	}
}

module.exports = ClassModule;
