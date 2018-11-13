'use strict';

const assert = require('assert');

const { Bento } = require('../../build');

describe('#removePrimaryComponent', async function () {
	it('should throw an error if name is not a string', async function () {
		const bento = new Bento();

		await assert.rejects(
			async () => bento.removePrimaryComponent(null),
			{ message: 'Name must be a string' },
		);
	});

	it('should throw an error if name is not specified', async function () {
		const bento = new Bento();

		await assert.rejects(
			async () => bento.removePrimaryComponent(''),
			{ message: 'Name must not be empty' },
		);
	});

	it('should attempt to call component onUnload', async function () {
		const bento = new Bento();

		let attempted = false;
		bento.primary.set('TestPlugin', {
			name: 'TestPlugin',
			async onUnload() {
				attempted = true;
			},
		});

		await bento.removePrimaryComponent('TestPlugin');

		assert.strictEqual(attempted, true, 'Component onUnload was not called');
	});
});
