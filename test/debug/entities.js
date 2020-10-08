const { Bento } = require('../../build');
const bento = new Bento();

const component = {
	name: 'testComponent',
	onLoad() {
		console.log('Component loaded');
	}
};

const plugin = {
	name: 'testPlugin',
	dependencies: [component],

	onLoad() {
		console.log('Plugin loaded');
	}
};

(async () => {
	await bento.addPlugin(plugin);
	await bento.addComponent(component);

	await bento.verify();
})().catch(e => console.log(e));