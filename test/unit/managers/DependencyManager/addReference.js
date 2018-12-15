'use strict';

const expect = require('unexpected');

const { DependencyManager } = require('../../../../build/managers/DependencyManager');

describe('#addReference', function () {
	const getClean = () => {
		const tested = new DependencyManager();

		return tested;
	};

	it('should not add a reference if the given component has the Object constructor', function () {
		const tested = getClean();

		tested.addReference(Object.create(null));
		tested.addReference({});

		expect(
			tested.references.size,
			'to be',
			0
		);
	});

	it('should add a reference to the constructor and use the name as the value', function () {
		const tested = getClean();

		class TestComponent {
			constructor() {
				this.name = 'TestComponent';
			}
		}

		const comp = new TestComponent();

		tested.addReference(comp);

		expect(
			tested.references.size,
			'to be',
			1
		);

		expect(
			tested.references.get(TestComponent),
			'to be',
			'TestComponent'
		);
	});
});
