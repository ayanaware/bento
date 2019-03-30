'use strict';

const { ComponentManager } = require('../../../../build/managers/ComponentManager');

describe('#loadComponent', function() {
	const getCleanComponentManager = () => {
		const manager = new ComponentManager({});

		manager.references = {};
		manager.dependencies = {};

		// mock __handleComponentLoad
		manager.bento.plugins = {};
		manager.bento.plugins.__handleComponentLoad = sinon.fake.resolves();

		return manager;
	};

	it('should attempt to call component onLoad', async function() {
		const manager = getCleanComponentManager();

		let attempted = false;
		await manager.loadComponent({
			name: 'TestComponent',
			async onLoad() {
				attempted = true;
			},
		});

		assert.strictEqual(attempted, true, 'Component onLoad was not called');
	});

	it('should throw an error if component onLoad throws an error', async function() {
		const bento = getCleanComponentManager();

		const testComponent = {
			name: 'TestComponent',
			async onLoad() {
				throw new Error('👌');
			},
		};

		expect(
			async () => bento.loadComponent(testComponent),
			'to error',
			'Component "TestComponent" failed to load'
		);
	});
});
