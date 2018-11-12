'use strict';

const { Bento } = require('../build');
const bento = new Bento();

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
	}

	async onLoad() {
		console.log('Henlo world from example2');

		const a = this.api.getPrimary('example');
		a.aFunction();

		const id = await this.api.subscribeEvent('example', 'ready', msg => {
			console.log('hi im example2 and', msg);

			console.log(this.api.subscriptions);
			this.api.unsubscribe('example', id);
			console.log(this.api.subscriptions);
		});
	}
}

(async () => {
	const example2 = new Example2();
	const example = new Example();

	await bento.addPrimaryComponent(example2);
	await bento.addPrimaryComponent(example);

	console.log(bento);
})();

