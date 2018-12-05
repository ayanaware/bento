'use strict';

const { Bento } = require('../../build');

const bento = new Bento();

(async () => {
	const testInject = {
		name: 'TestInject',
		hello() {
			return 'hello world';
		},
	};

	await bento.addComponent(testInject);

	await bento.addComponent({
		name: 'TestComponent',
		dependencies: [testInject],
		async onLoad() {
			this.api.injectComponent(testInject, 'testInject');

			console.log(this.testInject.hello());
		},
	});
})().catch(e => {
	console.error(e);
});
