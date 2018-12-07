'use strict';

const assert = require('assert');

const { Bento } = require('../../../build');

describe('#setProperties', function () {
	it('should add all properties given', function () {
		const bento = new Bento();

		const properties = {
			test: 'stuff',
			such: 'wow',
			very: 'weather',
		};

		bento.setProperty = function (name, value) {
			assert.strictEqual(properties[name], value);
		};

		bento.setProperties(properties);
	});
});
