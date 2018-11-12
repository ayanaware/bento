'use strict';

const path = require('path');

const { Bento, FSComponentLoader } = require('../build');

const bento = new Bento();
const fsloader = new FSComponentLoader({
	primary: path.resolve(__dirname, 'components', 'primary'),
	secondary: path.resolve(__dirname, 'components', 'secondary'),
});

bento.addPlugin(fsloader).catch(e => {
	console.log(e);
});

