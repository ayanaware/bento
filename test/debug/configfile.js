'use strict';

const { Bento, ConfigFileLoader } = require('../../build');

const bento = new Bento();

const config = new ConfigFileLoader();
config.addFile(__dirname, 'config.json');

bento.addPlugin(config).then(() => {
	console.log(bento.variables);
}).catch(e => {
	console.log(e);
});
