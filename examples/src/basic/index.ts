import { Bento, FSEntityLoader } from '@ayanaware/bento';

import { Logger } from '@ayanaware/logger';
const log = Logger.get();

// create bento instance
const bento = new Bento();

(async () => {
	const fsel = new FSEntityLoader();
	// Look for components in the ./components directory
	await fsel.addDirectory([__dirname, 'components']);

	// attach plugins and verify bento state
	await bento.addPlugin(fsel);
	await bento.verify();
})().catch(e => {
	log.error('Uh-oh it looks like this example is broken! Please let someone know.');
	log.error(e);
	process.exit(1);
});
