import { Bento, FSComponentLoader } from '@ayanaware/bento';

import { Logger } from '@ayana/logger';
const log = Logger.get(null);

// create bento instance
const bento = new Bento();

// Anonymous async function so we can use await
(async () => {
	// Use FSComponentLoader Plugin
	const fsloader = new FSComponentLoader();
	// Look for components in the ./components directory
	await fsloader.addDirectory(__dirname, 'components');

	// attach plugins and verify bento state
	await bento.addPlugin(fsloader);
	await bento.verify();
})().catch(e => {
	log.error('Uh-oh it looks like this example is broken! Please let someone know.');
	log.error(e);
	process.exit(1);
});
