'use strict';

const { ComponentManager, PrimaryComponent } = require('../build');
const manager = new ComponentManager();

// example component
class Example extends PrimaryComponent {
	constructor() {
		super('example', {
			required: true,
		});
	}

	async onMount() {
		console.log('Hello world!');
	}
}

const example = new Example();
manager.addPrimaryComponent(example).then(() => {
	console.log(manager);
});