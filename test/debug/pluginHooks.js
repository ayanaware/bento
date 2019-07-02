
const { Bento } = require('../../build');

const bento = new Bento();

const plugin = {
	name: 'examplePlugin',
	onPreComponentLoad(component) {
		console.log(component.name, `about to be loaded! (from ${plugin.name})`);
		component.myNumber = Math.random();
	},
	onPostComponentLoad(component) {
		console.log(component.name, `has loaded (from ${plugin.name})`);
	},
	onPreComponentUnload(component) {
		console.log(component.name, `about to be unloaded (from ${plugin.name})`);
	},
	onPostComponentUnload(component) {
		console.log(component.name, `has been unloaded! (from ${plugin.name})`);
	},
};

const plugin2 = {
	name: 'plugin2',

	myMethod() {
		return 'hello world';
	}
}

const component = {
	name: 'hello',
	onLoad() {
		console.log('My number is:', component.myNumber);

		this.api.injectPlugin(plugin2, 'plug2');

		console.log(this.plug2.myMethod(), 'injected plugin!');
	},
};

(async () => {
	await bento.addPlugin(plugin);

	await bento.addPlugin(plugin2);

	await bento.addComponent(component);
	await bento.removeComponent(component.name);
})().catch(e => {
	console.error('oof', e);
});
