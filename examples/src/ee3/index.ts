import { Bento } from '@ayanaware/bento';
import { Logger } from '@ayanaware/logger';

import { EventEmitter } from 'eventemitter3';

const log = Logger.get();

// create bento instance
const bento = new Bento({
	eventEmitter: () => new EventEmitter(), // tell bento to use a custom EventEmitter, in this case EventEmitter3
});

// Anonymous async function so we can use await
(async () => {
	log.info('Bento is now using ee3 instead of the native events.EventEmitter');

	await bento.verify();
})().catch(e => {
	log.error('Uh-oh it looks like this example is broken! Please let someone know.');
	log.error(e);
	process.exit(1);
});
