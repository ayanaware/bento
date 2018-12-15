'use strict';

const expect = require('unexpected');
const sinon = require('sinon');

const { ComponentManager } = require('../../../../build/managers/ComponentManager');

describe('#addComponent', function () {
	const getCleanComponentManager = () => {
		const manager = new ComponentManager({});

		manager.references = {};

		manager.prepareComponent = sinon.fake.resolves();
		manager.getMissingDependencies = sinon.fake.returns([]);
		manager.loadComponent = sinon.fake.resolves();
		manager.handlePendingComponents = sinon.fake.resolves();

		return manager;
	};

	it('should throw an error if the component is not an object or null', async function () {
		await expect(
			getCleanComponentManager().addComponent('totallyAComponent'),
			'to be rejected with',
			'Component must be a object'
		);

		await expect(
			getCleanComponentManager().addComponent(null),
			'to be rejected with',
			'Component must be a object'
		);
	});

	it('should throw an error if component name is not a string', async function () {
		await expect(
			getCleanComponentManager().addComponent({ name: null }),
			'to be rejected with',
			'Component name must be a string'
		);
	});

	it('should throw an error if a component with the same name already exists', async function () {
		const manager = getCleanComponentManager();

		manager.components.set('TestComponent', {});

		await expect(
			manager.addComponent({ name: 'TestComponent' }),
			'to be rejected with',
			`Component name "TestComponent" must be unique`
		);
	});

	it('should set dependencies to an empty array if they are not defined', async function () {
		const component = { name: 'TestComponent' };

		await getCleanComponentManager().addComponent(component);

		expect(
			component,
			'to have property',
			'dependencies',
			[]
		);
	});

	it('should throw an error if dependencies is set but not an array', async function () {
		await expect(
			getCleanComponentManager().addComponent({ name: 'TestComponent', dependencies: '' }),
			'to be rejected with',
			'"TestComponent" Component dependencies is not an array'
		);
	});

	it('should attempt to prepare the component', async function () {
		const manager = getCleanComponentManager();

		manager.prepareComponent = sinon.fake.resolves();

		await manager.addComponent({ name: 'TestComponent' });

		sinon.assert.calledOnce(manager.prepareComponent);
	});

	it('should attempt to load the component if it has no missing dependencies', async function () {
		const manager = getCleanComponentManager();

		manager.loadComponent = sinon.fake.resolves();

		await manager.addComponent({ name: 'TestComponent' });

		sinon.assert.calledOnce(manager.loadComponent);
	});

	it('should not handle pending components if no components are pending', async function () {
		const manager = getCleanComponentManager();

		manager.handlePendingComponents = sinon.fake.resolves();

		await manager.addComponent({ name: 'TestPrimary' });

		sinon.assert.notCalled(manager.handlePendingComponents);
	});

	it('should handle pending components if there are pending components', async function () {
		const manager = getCleanComponentManager();

		manager.handlePendingComponents = sinon.fake.resolves();

		manager.pending.set('TestPending', {});

		await manager.addComponent({ name: 'TestPrimary' });

		sinon.assert.calledOnce(manager.handlePendingComponents);
	});

	it('should add the component to pending if dependencies are missing', async function () {
		const manager = getCleanComponentManager();

		manager.getMissingDependencies = sinon.fake.returns(['TestDependency']);

		await manager.addComponent({ name: 'TestPrimary' });

		expect(
			manager.pending.size,
			'to be',
			1
		);
	});

	it('should return the component name', async function () {
		const name = await getCleanComponentManager().addComponent({ name: 'TestComponent' });

		expect(
			name,
			'to be',
			'TestComponent'
		);
	});
});
