'use strict';

const assert = require('assert');

const { Bento } = require('../../build');

describe('#addPrimaryComponent', function () {
	const getCleanBento = () => {
		const bento = new Bento();

		bento.getMissingDependencies = function () {
			return [];
		};

		bento.registerPrimaryComponent = async function () {
			return true;
		};

		bento.handlePendingComponents = async function () {
			// Do nothing
		};

		return bento;
	};

	it('should throw an error if the component is not an object', async function () {
		await assert.rejects(
			getCleanBento().addPrimaryComponent('totallyAComponent'),
			{ message: 'Component must be a object' },
		);
	});

	it('should throw an error if name is not a string', async function () {
		await assert.rejects(
			getCleanBento().addPrimaryComponent({ name: null }),
			{ message: 'Component name must be a string' },
		);
	});

	it('should throw an error if the component does not specify a name', async function () {
		await assert.rejects(
			getCleanBento().addPrimaryComponent({ name: '' }),
			{ message: 'Primary components must specify a name' },
		);
	});

	it('should throw an error if a component with the same name already exists', async function () {
		const bento = getCleanBento();

		bento.primary.set('TestPrimary', {});

		await assert.rejects(
			bento.addPrimaryComponent({ name: 'TestPrimary' }),
			{ message: `Component name "TestPrimary" must be unique` },
		);
	});

	it('should throw an error if dependencies is set but not an array', async function () {
		await assert.rejects(
			getCleanBento().addPrimaryComponent({ name: 'TestPrimary', dependencies: '' }),
			{ message: '"TestPrimary" Component dependencies is not an array' },
		);
	});

	it('should attempt registering the component if it has no missing dependencies', async function () {
		const bento = getCleanBento();

		let attempted = false;
		bento.registerComponent = async function () {
			attempted = true;
		};

		await bento.addPrimaryComponent({ name: 'TestPrimary' });

		assert.strictEqual(attempted, true, 'registerPrimaryComponent() wasn\'t called');
	});

	it('should not handle pending components if the registration fails', async function () {
		const bento = getCleanBento();

		await bento.addPrimaryComponent({ name: 'TestPrimaryAdded', dependencies: ['TestDependency'] });

		bento.registerPrimaryComponent = async function () {
			return false;
		};

		bento.handlePendingComponents = async function () {
			throw new Error('Pending components were handled');
		};

		await bento.addPrimaryComponent({ name: 'TestPrimary' });
	});

	it('should not handle pending components if no components are pending', async function () {
		const bento = getCleanBento();

		bento.handlePendingComponents = async function () {
			throw new Error('Pending components were handled');
		};

		await bento.addPrimaryComponent({ name: 'TestPrimary' });
	});

	it('should handle pending components if the registration succeded and there are pending components', async function () {
		const bento = getCleanBento();

		let handleCalled = false;
		bento.handlePendingComponents = async function () {
			handleCalled = true;
		};

		bento.pending.set('TestPending', {});

		await bento.addPrimaryComponent({ name: 'TestPrimary' });

		assert.strictEqual(handleCalled, true, 'Pending components were not handled');
	});

	it('should add the component to pending if dependencies are missing', async function () {
		const bento = getCleanBento();

		bento.getMissingDependencies = function () {
			return ['TestDependency'];
		};

		await bento.addPrimaryComponent({ name: 'TestPrimary' });

		assert.strictEqual(bento.pending.size, 1, 'Component wasn\'t added to the pending map');
	});

	it('should return the component name', async function () {
		const name = await getCleanBento().addPrimaryComponent({ name: 'TestPrimary' });
		assert.strictEqual(name, 'TestPrimary');
	});
});
