'use strict';

const assert = require('assert');

const { Bento } = require('../../build');

describe('#registerComponent', async function () {
	it('should define component api', async function () {
		const bento = new Bento();

		const testComponent = { name: 'TestComponent' };

		bento.handleDecorators = function () {
			// Disabled for this test
		};

		await bento.registerComponent('primary', testComponent);

		assert.strictEqual(
			Object.prototype.hasOwnProperty.call(testComponent, 'api'),
			true, 'Component api was not defined',
		);
	});

	it('should create primary component event helper', async function () {
		const bento = new Bento();

		bento.handleDecorators = function () {
			// Disabled for this test
		};

		await bento.registerComponent('primary', { name: 'TestComponent' });

		assert.strictEqual(bento.events.has('TestComponent'), true, 'Component event helper does not exist');
	});

	it('should attempt to call component onLoad', async function () {
		const bento = new Bento();

		bento.handleDecorators = function () {
			// Disabled for this test
		};

		let attempted = false;
		await bento.registerComponent('primary', {
			name: 'TestComponent',
			async onLoad() {
				attempted = true;
			},
		});

		assert.strictEqual(attempted, true, 'Component onLoad was not called');
	});

	it('should throw an error if primary component onLoad throws an error', async function () {
		const bento = new Bento();

		bento.handleDecorators = function () {
			// Disabled for this test
		};

		const testComponent = {
			name: 'TestComponent',
			async onLoad() {
				throw new Error('👌');
			},
		};

		await assert.rejects(
			async () => bento.registerComponent('primary', testComponent),
			{ message: 'Component "TestComponent" failed loading' }
		);
	});
});
