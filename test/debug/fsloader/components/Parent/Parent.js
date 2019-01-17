'use strict';

class Parent {
	constructor() {
		this.name = 'Parent';
	}

	async onLoad() {
		await this.api.loadComponents('FSComponentLoader', __dirname, 'children');
	}
}

module.exports = Parent;
