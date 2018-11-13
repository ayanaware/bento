'use strict';

const { Bento, ConfigLoader } = require('../../build');

const bento = new Bento();

const config = new ConfigLoader();

class Test {
	constructor() {
		this.name = 'TestComponent';
	}

	async onLoad() {
		this.api.addDefinitions([
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

		const someVal = this.api.getVariable('someVal');
		console.log('someVal =', someVal);
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

	await bento.addPrimaryComponent(instance);
});
