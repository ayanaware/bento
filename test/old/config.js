'use strict';

const { Bento, ConfigLoader } = require('../../build');

const bento = new Bento();

const config = new ConfigLoader();

class Test {
	constructor() {
		this.name = 'TestComponent';
	}

	async onLoad() {
		this.api.defineVariables([
			{
				type: 'string',
				name: 'someVal',
				default: 'blah',
			},
			{
				type: 'number',
				name: 'noExist',
			},
		]);

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

	try {
		await bento.addPrimaryComponent(instance);
	} catch (e) {
		console.log(e);
	}
});
