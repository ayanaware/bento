'use strict';

const { Bento, FSComponentLoader } = require('../../../build');

const bento = new Bento();
const fsloader = new FSComponentLoader();

(async () => {
	// add components directory
	await fsloader.addDirectory(__dirname, 'components');

	await bento.addPlugin(fsloader);

	console.log(bento.components.components);
})();

