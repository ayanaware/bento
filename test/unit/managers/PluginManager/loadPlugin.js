'use strict';

const assert = require('assert');
const sinon = require('sinon');

const { PluginManager } = require('../../../../build/managers/PluginManager');

describe('#loadPlugin', function () {
	const getClean = () => {
		const tested = new PluginManager({});

		tested.references = {};
		tested.references.addReference = sinon.fake();

		return tested;
	};

	it('should define bento property on plugin', async function () {
		const tested = getClean();

		const testPlugin = { name: 'TestPlugin' };

		await tested.loadPlugin(testPlugin);

		assert.strictEqual(Object.prototype.hasOwnProperty.call(testPlugin, 'bento'), true, 'Bento property was not defined');
	});

	it('should attempt to call plugin onLoad method', async function () {
		const tested = getClean();

		let attempted = false;
		await tested.addPlugin({
			name: 'TestPlugin',
			async onLoad() {
				attempted = true;
			},
		});

		assert.strictEqual(attempted, true, 'Plugin onLoad was not called');
	});
});
