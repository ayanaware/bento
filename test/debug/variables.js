const { Bento, Variable } = require('../../build');
const bento = new Bento();

class Test {
	constructor() {
		this.name = 'self';
	}
	onLoad() {
		console.log('Component loaded');
		console.log(this.test);
	}
}

Variable({ name: 'TEST' })(Test, 'test');

(async () => {
	bento.setVariable('TEST', 'hello world');

	await bento.addComponent(Test);

	await bento.verify();
})().catch(e => console.log(e));
