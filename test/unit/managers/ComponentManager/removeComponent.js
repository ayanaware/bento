'use strict';

const { ComponentManager } = require('../../../../build/managers/ComponentManager');

describe('#removeComponent', function() {
	const getCleanComponentManager = () => {
		const manager = new ComponentManager({});

		manager.references = {};
		manager.references.removeReference = sinon.fake();

		manager.getComponentChildren = sinon.fake.returns([]);

		manager.bento.plugins = {};
		manager.bento.plugins.__handleComponentUnload = sinon.fake.resolves();

		return manager;
	};

	it('should throw an error if name is not a string', async function() {
		const manager = getCleanComponentManager();

		await expect(
			manager.removeComponent(null),
			'to be rejected with',
			'Name must be a string'
		);
	});

	it('should throw an error if name is not specified', async function() {
		const manager = getCleanComponentManager();

		await expect(
			manager.removeComponent(''),
			'to be rejected with',
			'Name must not be empty',
		);
	});

	it('should throw an error if the component is not loaded', async function() {

	});

	it('should attempt to get its children', async function() {

	});

	it('should attempt to remove each of its children', async function() {

	});

	it('should attempt to unload the component', async function() {
		const manager = getCleanComponentManager();

		const component = {
			name: 'TestComponent',
			onUnload: sinon.fake.resolves(),
		};

		manager.components.set('TestComponent', component);

		await manager.removeComponent('TestComponent');

		sinon.assert.calledOnce(component.onUnload);
	});

	it('should not require the unload function to be present', async function() {

	});

	// TODO Parent handling

	it('should remove the constructor from the list', async function() {

	});

	it('should remove the component', async function() {

	});
});
