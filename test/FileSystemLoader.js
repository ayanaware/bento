'use strict';

const path = require('path');

const { Bento, FileSystemLoader } = require('../build');

const bento = new Bento();
const fileSystemLoader = new FileSystemLoader({
	primary: path.resolve(__dirname, 'components', 'primary'),
	secondary: path.resolve(__dirname, 'components', 'secondary'),
});

bento.addPlugin(fileSystemLoader);

