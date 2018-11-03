'use strict';

const path = require('path');

const { ComponentManager, FileSystemLoader } = require('../build');

const manager = new ComponentManager();
const loader = new FileSystemLoader({
	primary: path.resolve('./test/components/primary'),
	secondary: path.resolve('./test/components/secondary'),
});

loader.attach(manager);

loader.load().catch(e => {
	console.log(e);
});

