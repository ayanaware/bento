'use strict';

const { Bento } = require('../../build');
const bento = new Bento();

const parent = {
	name: 'TestParent',
	async onChildLoad(child) {
		console.log(`Child component ${child.name} has Loaded!`);
	},
};

const child = {
	name: 'TestChild',
	parent: parent,
	async onLoad() {
		console.log(`Hello from ${child.name}`);
	},
};

(async () => {
	await bento.addComponent(child);
	await bento.addComponent(parent);
})().catch(e => {
	console.error(e);
});
