'use strict';

const { PluginManager } = require('../../../../build/managers/PluginManager');

describe('#addPlugin', function() {
	const getClean = () => {
		const tested = new PluginManager({});

		tested.references = {};

		tested.loadPlugin = sinon.fake.resolves();

		return tested;
	};

	it('should throw an error if plugin is not an object', async function() {
		const tested = getClean();

		await assert.rejects(
			async () => tested.addPlugin(null),
			{ message: 'Plugin must be a object' },
		);
	});

	it('should throw an error if plugin name is not a string', async function() {
		const tested = getClean();

		await assert.rejects(
			async () => tested.addPlugin({ name: null }),
			{ message: 'Plugin name must be a string' },
		);
	});

	it('should throw an error if plugin does not specify a name', async function() {
		const tested = getClean();

		await assert.rejects(
			async () => tested.addPlugin({ name: '' }),
			{ message: 'Plugin must specify a name' },
		);
	});

	it('should throw an error if a plugin with the same name already exists', async function() {
		const tested = getClean();

		tested.plugins.set('TestPlugin', {});

		await assert.rejects(
			async () => tested.addPlugin({ name: 'TestPlugin' }),
			{ message: 'Plugin names must be unique' },
		);
	});

	it('should attempt to load the plugin', async function() {
		const tested = getClean();

		await tested.addPlugin({ name: 'TestPlugin' });

		sinon.assert.calledOnce(tested.loadPlugin);
	});

	it('should return the plugin name', async function() {
		const tested = getClean();

		assert.strictEqual(
			await tested.addPlugin({ name: 'TestPlugin' }),
			'TestPlugin',
		);
	});
});
