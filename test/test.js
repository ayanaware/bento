'use strict';

const { ComponentManager } = require('../build');
const manager = new ComponentManager();

// example component
class Example {
	constructor() {
		this.name = 'example';
	}

	async onLoad() {
		console.log('Hello world from example');

		setTimeout(() => {
			console.log('I\'m example1 and im sending a event!');
    	this.api.emit('ready', 'somebody once told me the world was gonna roll me');
		}, 3000)
	}

	aFunction() {
		console.log('woah, c00l d00d!');
	}
}

class Example2 {
	constructor() {
		this.name = 'exampleButDepend';

		this.dependencies = ['example'];
		this.required = true;
	}

	async onLoad() {
		console.log('Henlo world from example2');

		const a = this.api.getPrimary('example');
		a.aFunction();

		const id = await this.api.subscribe('example', 'ready', msg => {
			console.log('hi im example2 and', msg);

			console.log(this.api.subscribers);
			this.api.unsubscribe('example', id);
			console.log(this.api.subscribers);
		});
	}
}

(async () => {
	const example2 = new Example2();
	const example = new Example();

	await manager.addPrimaryComponent(example2);
	await manager.addPrimaryComponent(example);

	console.log(manager);
})();

