'use strict';

const expect = require('unexpected');
const sinon = require('sinon');

const { ComponentManager } = require('../../../../build/managers/ComponentManager');

describe('#getComponentEvents', function () {
	const getCleanComponentManager = () => {
		const manager = new ComponentManager({});

		manager.resolveName = sinon.fake();

		return manager;
	};

	it('should attempt to resolve the given component', function () {
		const manager = getCleanComponentManager();

		manager.getComponentEvents('FakeComponent');

		sinon.assert.calledOnce(manager.resolveName);
	});

	it('should return null if the given component events could not be found', function () {
		const manager = getCleanComponentManager();

		expect(
			manager.getComponentEvents('FakeComponent'),
			'to be null'
		);
	});

	it('should return the component if it could be found', function () {
		const manager = getCleanComponentManager();

		manager.resolveName = sinon.fake.returns('FakeComponent');

		const events = {};
		manager.events.set('FakeComponent', events);

		expect(
			manager.getComponentEvents(), // FakeComponent is returned by resolveName
			'to be',
			events,
		);
	});
});
