const { Bento, Variable } = require('../../build');
const bento = new Bento();

const component = {
	name: 'self',
	onLoad() {
		console.log('Component loaded');
	}
};

Variable({ name: 'TEST' })(component, 'test');

(async () => {
	await bento.addComponent(component);

	await bento.verify();
})().catch(e => console.log(e));