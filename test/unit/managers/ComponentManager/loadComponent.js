'use strict';

const assert = require('assert');

const { ComponentManager } = require('../../../../build/managers/ComponentManager');

describe.skip('#loadComponent', function () {
	const getCleanComponentManager = () => {
		const manager = new ComponentManager({});

		return manager;
	};

	it('should attempt to call component onLoad', async function () {
		const bento = getCleanComponentManager();

		let attempted = false;
		await bento.loadComponent({
			name: 'TestComponent',
			async onLoad() {
				attempted = true;
			},
		});

		assert.strictEqual(attempted, true, 'Component onLoad was not called');
	});

	it('should throw an error if component onLoad throws an error', async function () {
		const bento = getCleanComponentManager();

		const testComponent = {
			name: 'TestComponent',
			async onLoad() {
				throw new Error('👌');
			},
		};

		await assert.rejects(
			async () => bento.loadComponent(testComponent),
			{ message: 'Component "TestComponent" failed loading' }
		);
	});
});
