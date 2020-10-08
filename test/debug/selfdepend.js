const { Bento } = require('../../build');
const bento = new Bento();

const component = {
	name: 'self',
	dependencies: ['self'],
	onLoad() {
		console.log('Component loaded');
	}
};

(async () => {
	await bento.addComponent(component);

	await bento.verify();
})().catch(e => console.log(e));