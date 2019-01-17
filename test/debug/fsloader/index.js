'use strict';

const { Bento, FSComponentLoader } = require('../../../build');

const bento = new Bento();
const fsloader = new FSComponentLoader();

(async () => {
	// add components directory
	await fsloader.addDirectory(__dirname, 'components');

	await bento.addPlugin(fsloader);

	const state = await bento.verify();

	console.log('Application State:', state);
})();

