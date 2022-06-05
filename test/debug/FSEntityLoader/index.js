'use strict';

const { Bento, FSEntityLoader } = require('../../../build');

const bento = new Bento();
const fsel = new FSEntityLoader();

(async () => {
	// add components directory
	await fsel.addDirectory(__dirname, 'components');

	await bento.addPlugin(fsel);

	const state = await bento.verify();

	console.log('Application State:', state);
})();

