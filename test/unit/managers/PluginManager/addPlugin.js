'use strict';

const assert = require('assert');

const { Bento } = require('../../../../build');

describe('#addPlugin', async function () {
	it('should throw an error if plugin is not an object', async function () {
		const bento = new Bento();

		await assert.rejects(
			async () => bento.addPlugin(null),
			{ message: 'Plugin must be a object' },
		);
	});

	it('should throw an error if plugin name is not a string', async function () {
		const bento = new Bento();

		await assert.rejects(
			async () => bento.addPlugin({ name: null }),
			{ message: 'Plugin name must be a string' },
		);
	});

	it('should throw an error if plugin does not specify a name', async function () {
		const bento = new Bento();

		await assert.rejects(
			async () => bento.addPlugin({ name: '' }),
			{ message: 'Plugin must specify a name' },
		);
	});

	it('should throw an error if a plugin with the same name already exists', async function () {
		const bento = new Bento();

		bento.plugins.set('TestPlugin', {});

		await assert.rejects(
			async () => bento.addPlugin({ name: 'TestPlugin' }),
			{ message: 'Plugin names must be unique' },
		);
	});

	it('should attempt to register the plugin', async function () {
		const bento = new Bento();

		let attempted = false;
		bento.registerPlugin = async () => {
			attempted = true;
		};

		await bento.addPlugin({ name: 'TestPlugin' });

		assert.strictEqual(attempted, true, 'Plugin registration was not attempted');
	});

	it('should return the plugin name', async function () {
		const bento = new Bento();

		bento.registerPlugin = async function () {
			// Disabled for this test
		};

		assert.strictEqual(
			await bento.addPlugin({ name: 'TestPlugin' }),
			'TestPlugin',
		);
	});
});
