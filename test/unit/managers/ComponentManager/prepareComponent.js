'use strict';

const assert = require('assert');

const { ComponentManager } = require('../../../../build/managers/ComponentManager');

describe.skip('#prepareComponent', function () {
	const getCleanComponentManager = () => {
		const manager = new ComponentManager({});

		return manager;
	};

	it('should define component api', async function () {
		const bento = getCleanComponentManager();

		const testComponent = { name: 'TestComponent' };

		await bento.prepareComponent(testComponent);

		assert.strictEqual(
			Object.prototype.hasOwnProperty.call(testComponent, 'api'),
			true, 'Component api was not defined',
		);
	});

	it('should create component event helper', async function () {
		const bento = getCleanComponentManager();

		await bento.prepareComponent({ name: 'TestComponent' });

		assert.strictEqual(bento.events.has('TestComponent'), true, 'Component event helper does not exist');
	});
});
