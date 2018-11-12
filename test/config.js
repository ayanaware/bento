'use strict';

const { Bento } = require('../build');

const bento = new Bento();

bento.setVariable('someVal', Math.random());

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
				default: 1,
			},
		]);

		const someVal = this.api.getVariable('someVal');
		console.log('someVal =', someVal);
	}
}

const instance = new Test();

bento.addPrimaryComponent(instance)
.catch(e => {
	console.log(e);
})
