'use strict';

const { Bento } = require('../../build');

const bento = new Bento();

bento.setProperties({
	name: 'shard',
	generation: new Date(),
	version: 'v0.0.1',
});

console.log('application version =', bento.getProperty('version'));

console.log(bento.properties);
