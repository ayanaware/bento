'use strict';

const { ComponentManager } = require('../../../../build/managers/ComponentManager');

describe('#getComponent', function() {
	const getCleanComponentManager = () => {
		const manager = new ComponentManager({});

		manager.references = {};

		manager.resolveName = sinon.fake();

		return manager;
	};

	it('should attempt to resolve the given component', function() {
		const manager = getCleanComponentManager();

		manager.getComponent('FakeComponent');

		sinon.assert.calledOnce(manager.resolveName);
	});

	it('should return null if the given component could not be found', function() {
		const manager = getCleanComponentManager();

		expect(
			manager.getComponent('FakeComponent'),
			'to be null'
		);
	});

	it('should return the component if it could be found', function() {
		const manager = getCleanComponentManager();

		manager.resolveName = sinon.fake.returns('FakeComponent');

		const component = { name: 'FakeComponent' };
		manager.components.set('FakeComponent', component);

		expect(
			manager.getComponent(), // FakeComponent is returned by resolveName
			'to be',
			component,
		);
	});
});
