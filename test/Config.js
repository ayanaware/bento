'use strict';

const { Bento, ConfigLoader } = require('../build');

const bento = new Bento();

const config = new ConfigLoader({
	definitions: [
		{
			type: 'string',
			name: 'FOO',
			value: {
				env: 'FOO',
			}
		},
		{
			type: 'number',
			name: 'BAR',
			value: 2,
			validator: {
				name: 'gt',
				arg: 1,
			},
		},
	]
});

bento.addPlugin(config).then(() => {
	console.log(bento);
})
.catch(e => {
	console.log(e);
})
