'use strict';

const assert = require('assert');

const { Bento } = require('../../../build');

describe('#prepareComponent', async function () {
	it('should define component api', async function () {
		const bento = new Bento();

		const testComponent = { name: 'TestComponent' };

		await bento.prepareComponent(testComponent);

		assert.strictEqual(
			Object.prototype.hasOwnProperty.call(testComponent, 'api'),
			true, 'Component api was not defined',
		);
	});

	it('should create component event helper', async function () {
		const bento = new Bento();

		await bento.prepareComponent({ name: 'TestComponent' });

		assert.strictEqual(bento.events.has('TestComponent'), true, 'Component event helper does not exist');
	});
});
