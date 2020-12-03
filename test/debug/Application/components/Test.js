const { ProcessingError } = require('@ayanaware/errors');

// @fs-entity
module.exports = {
	name: 'test',
	async onLoad() {
		console.log('Hello world UwU');
	}
};