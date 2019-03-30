
const { Bento } = require('../../build');

const bento = new Bento();

const plugin = {
	name: 'examplePlugin',
	onComponentLoad(component) {
		console.log(component.name, `has loaded! (from ${plugin.name})`);
		component.myNumber = Math.random();
	},
	onComponentUnload(component) {
		console.log(component.name, `has been unloaded! (from ${plugin.name})`);
	},
};

const component = {
	name: 'hello',
	onLoad() {
		console.log('My number is:', component.myNumber);
	},
};

(async () => {
	await bento.addPlugin(plugin);

	await bento.addComponent(component);
	await bento.removeComponent(component.name);
})().catch(e => {
	console.error('oof', e);
});
