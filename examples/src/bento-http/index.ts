'use strict';

// See README.md
import * as path from 'path';

import { Bento, ConfigLoader, FSComponentLoader } from '@ayana/bento';

import { Logger } from '@ayana/logger';
const log = Logger.get(null);

// first we start by creating a new bento instance
const bento = new Bento();

// application properties
const { version } = require('../../package.json');

// properties are runtime static information values
bento.setProperties({
	name: 'example-http',
	version,
});

(async () => {
	const config = new ConfigLoader();

	// other ways to load vars will be available in the future like config.json
	await config.addDefinitions([
		{
			name: 'port',
			env: 'PORT',
		},
	]);

	// New Filesystem loader
	const fsloader = new FSComponentLoader({
		primary: path.resolve(__dirname, 'primary'),
		secondary: path.resolve(__dirname, 'secondary'),
	});

	// add plugins
	await bento.addPlugins([config, fsloader]);
})().catch(e => {
	log.error('Uh-oh it looks like this example is broken! Please let someone know.');
	console.log(e);
});
