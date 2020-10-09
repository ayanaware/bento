const { Bento, Variable } = require('../../build');
const bento = new Bento();

const component = {
	name: 'self',
	onLoad() {
		console.log('Component loaded');
		console.log(this.test);
	}
};

Variable({ name: 'TEST' })(component, 'test');

(async () => {
	bento.setVariable('TEST', 'hello world');

	await bento.addComponent(component);

	await bento.verify();
})().catch(e => console.log(e));