'use strict';

const path = require('path');

const { Bento, FSComponentLoader } = require('../../build');

const bento = new Bento();
const fsloader = new FSComponentLoader({
	primary: path.resolve(__dirname, 'components', 'primary'),
});

bento.addPlugin(fsloader).then(async () => {
	console.log(bento.primaryConstructors);

	const ClassModule = require('./components/primary/ClassModule');
	const name = bento.resolveComponentName(ClassModule);
	console.log(name);

	console.log('object resolveName', bento.resolveComponentName({ name: 'ClassModule' }));

	await bento.removePrimaryComponent(name);

	console.log(bento.primaryConstructors);
}).catch(e => {
	console.log(e);
});

