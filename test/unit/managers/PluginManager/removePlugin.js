'use strict';

const assert = require('assert');
const sinon = require('sinon');

const { PluginManager } = require('../../../../build/managers/PluginManager');

describe('#removePlugin', async function () {
	const getClean = () => {
		const tested = new PluginManager({});

		tested.references = {};
		tested.references.removeReference = sinon.fake();

		return tested;
	};

	it('should throw an error if name is not a string', async function () {
		const tested = getClean();

		await assert.rejects(
			async () => tested.removePlugin(null),
			{ message: 'Plugin name must be a string' },
		);
	});

	it('should throw an error if name is empty', async function () {
		const tested = getClean();

		await assert.rejects(
			async () => tested.removePlugin(''),
			{ message: 'Plugin name must not be empty' },
		);
	});

	it('should throw an error if provided plugin is not loaded', async function () {
		const tested = getClean();

		await assert.rejects(
			async () => tested.removePlugin('TestPlugin'),
			{ message: 'Plugin "TestPlugin" is not currently attached' },
		);
	});

	it('should attempt to call onUnload on plugin before removing', async function () {
		const tested = getClean();

		let attempted = false;
		tested.plugins.set('TestPlugin', {
			name: 'TestPlugin',
			async onUnload() {
				attempted = true;
			},
		});

		await tested.removePlugin('TestPlugin');

		assert.strictEqual(attempted, true, 'Plugin onUnload was not called');
	});
});
