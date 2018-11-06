'use strict';

const path = require('path');

const { Bento, FileSystemLoaderPlugin } = require('../build');

const bento = new Bento();
const fsloader = new FileSystemLoaderPlugin({
	primary: path.resolve(__dirname, 'components', 'primary'),
	secondary: path.resolve(__dirname, 'components', 'secondary'),
});

bento.addPlugin(fsloader).catch(e => {
	console.log(e);
});

