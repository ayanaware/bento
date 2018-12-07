'use strict';

const path = require('path');

const { Bento, FSComponentLoader } = require('../../build');

const bento = new Bento();
const fsloader = new FSComponentLoader({
	directories: [path.resolve(__dirname, 'components')],
});

bento.addPlugin(fsloader).then(async () => {
	console.log(bento.componentConstructors);

	const ClassModule = require('./components/ClassModule');
	const name = bento.resolveComponentName(ClassModule);
	console.log(name);

	console.log('object resolveName', bento.resolveComponentName({ name: 'ClassModule' }));

	await bento.removeComponent(name);

	console.log(bento.componentConstructors);
}).catch(e => {
	console.log(e);
});

