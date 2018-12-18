'use strict';

const assert = require('assert');
const sinon = require('sinon');

const { ComponentManager } = require('../../../../build/managers/ComponentManager');

describe('#prepareComponent', function () {
	const getCleanComponentManager = () => {
		const manager = new ComponentManager({});

		manager.resolveName = sinon.fake.returns(null);

		manager.references = {};
		manager.references.addReference = sinon.fake();

		return manager;
	};

	it('should define component api', async function () {
		const bento = getCleanComponentManager();

		bento.resolveName = sinon.fake.returns('TestComponent');

		const testComponent = { name: 'TestComponent', dependencies: [] };

		await bento.prepareComponent(testComponent);

		assert.strictEqual(
			Object.prototype.hasOwnProperty.call(testComponent, 'api'),
			true, 'Component api was not defined',
		);
	});

	it('should create component event helper', async function () {
		const bento = getCleanComponentManager();

		bento.resolveName = sinon.fake.returns('TestComponent');

		await bento.prepareComponent({ name: 'TestComponent', dependencies: [] });

		assert.strictEqual(bento.events.has('TestComponent'), true, 'Component event helper does not exist');
	});
});
