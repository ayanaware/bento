'use strict';

const assert = require('assert');
const sinon = require('sinon');

const { ComponentManager } = require('../../../../build/managers/ComponentManager');

describe('#prepareComponent', function () {
	const getCleanComponentManager = () => {
		const manager = new ComponentManager({});

		manager.references = {};

		manager.references.addReference = sinon.fake();
		manager.resolveDependencies = sinon.fake.returns([]);

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
