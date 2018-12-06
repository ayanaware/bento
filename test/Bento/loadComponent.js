'use strict';

const assert = require('assert');

const { Bento } = require('../../build');

describe('#loadComponent', async function () {
	it('should attempt to call component onLoad', async function () {
		const bento = new Bento();

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
		const bento = new Bento();

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
