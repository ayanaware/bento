'use strict';

const assert = require('assert');

const { Bento } = require('../../build');

describe('#removePlugin', async function () {
	it('should throw an error if name is not a string', async function () {
		const bento = new Bento();

		await assert.rejects(
			async () => bento.removePlugin(null),
			{ message: 'Plugin name must be a string' },
		);
	});

	it('should throw an error if name is empty', async function () {
		const bento = new Bento();

		await assert.rejects(
			async () => bento.removePlugin(''),
			{ message: 'Plugin name must not be empty' },
		);
	});

	it('should throw an error if provided plugin is not loaded', async function () {
		const bento = new Bento();

		await assert.rejects(
			async () => bento.removePlugin('TestPlugin'),
			{ message: 'Plugin "TestPlugin" is not currently attached' },
		);
	});

	it('should attempt to call onUnload on plugin before removing', async function () {
		const bento = new Bento();

		let attempted = false;
		bento.plugins.set('TestPlugin', {
			name: 'TestPlugin',
			async onUnload() {
				attempted = true;
			},
		});

		await bento.removePlugin('TestPlugin');

		assert.strictEqual(attempted, true, 'Plugin onUnload was not called');
	});
});
