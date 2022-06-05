'use strict';

// @fs-entity
class ClassModule {
	constructor() {
		this.name = 'ClassModule';
	}

	async onLoad() {
		console.log('Hello from CommonJS Class');
	}
}

module.exports = ClassModule;
