'use strict';

const { Bento } = require('../../build');
const bento = new Bento();

const parent = {
	name: 'TestParent',
	async onUnload() {
		console.log(`Parent component ${parent.name} has unloaded`);
	},
	async onChildLoad(child) {
		console.log(`Child component ${child.name} has Loaded!`);
	},
	async onChildUnload(child) {
		console.log(`Child component ${child.name} has unloaded`);
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

	console.log('Testing Child unloading before parent');
	await bento.removeComponent(child.name);

	process.stdout.write('\n\n\n');
	console.log('Testing Parent unloading before child');
	await bento.addComponent(child);
	await bento.removeComponent(parent.name);
})().catch(e => {
	console.error(e);
});
