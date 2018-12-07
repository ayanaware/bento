'use strict';

const path = require('path');

const { Bento, FSComponentLoader } = require('../../build');

const bento = new Bento();
const fsloader = new FSComponentLoader({
	directories: [path.resolve(__dirname, 'components')],
});

bento.addPlugin(fsloader).then(async () => {
	console.log(bento.components.constructors);

	const ClassModule = require('./components/ClassModule');
	const name = bento.components.resolveName(ClassModule);
	console.log(name);

	console.log('object resolveName', bento.components.resolveName({ name: 'ClassModule' }));

	await bento.removeComponent(name);

	console.log(bento.components.constructors);
}).catch(e => {
	console.log(e);
});

