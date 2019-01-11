'use stirct';

const FSComponentLoader = require('../../build/plugins/loaders/FSComponentLoader');
const fsloader = new FSComponentLoader.FSPlugin();

fsloader.addDirectory(__dirname, 'components');
