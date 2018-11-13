'use strict';

const assert = require('assert');

const { Bento } = require('../../build');

describe('#registerPlugin', async function () {
	it('should define bento property on plugin', async function () {
		const bento = new Bento();

		const testPlugin = { name: 'TestPlugin' };

		await bento.registerPlugin(testPlugin);

		assert.strictEqual(Object.prototype.hasOwnProperty.call(testPlugin, 'bento'), true, 'Bento property was not defined');
	});

	it('should attempt to call plugin onLoad method', async function () {
		const bento = new Bento();

		let attempted = false;
		await bento.addPlugin({
			name: 'TestPlugin',
			async onLoad() {
				attempted = true;
			},
		});

		assert.strictEqual(attempted, true, 'Plugin onLoad was not called');
	});
});
