'use strict';

const { Bento, ConfigLoader } = require('../../build');

const bento = new Bento();

const config = new ConfigLoader();

class Test {
	constructor() {
		this.name = 'TestComponent';
	}

	async onLoad() {
		this.api.injectVariable({
			name: 'someVal',
			default: 'blah',
		}, 'someVal');

		console.log('someVal =', this.someVal);
	}
}

const instance = new Test();

bento.addPlugin(config).then(async () => {
	await config.addDefinitions([
		{
			name: 'someVal',
			env: 'EXAMPLE',
		},
		{
			name: 'noExist',
			value: 'abcdef',
		},
	]);

	console.log(bento.variables.getVariable('someVal'));
	console.log(bento.variables.getSource('someVal'));

	try {
		await bento.addComponent(instance);
	} catch (e) {
		console.log(e);
	}
});
