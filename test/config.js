'use strict';

const { Bento, ConfigLoader } = require('../build');

const bento = new Bento();

bento.setVariable('someVal', Math.random());

class Test {
	constructor() {
		this.name = 'TestComponent';

		this.variables = [
			{
				type: 'string',
				name: 'someVal',
				default: 'blah',
				required: true,
			},
			{
				type: 'number',
				name: 'noExist',
				required: true,
			},
		];
	}

	async onLoad() {
		const someVal = this.api.getVariable('someVal');
		console.log('someVal =', someVal);
	}
}

const instance = new Test();

bento.addPrimaryComponent(instance)
.catch(e => {
	console.log(e);
})
