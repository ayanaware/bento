'use strict';

const expect = require('unexpected');

const { ReferenceManager } = require('../../../../build/managers/ReferenceManager');

describe('#removeReference', function () {
	const getClean = () => {
		const tested = new ReferenceManager();

		return tested;
	};

	it('should delete the reference to the constructor', function () {
		const tested = getClean();

		class TestComponent {
			constructor() {
				this.name = 'TestComponent';
			}
		}

		const comp = new TestComponent();

		tested.references.set(TestComponent, comp.name);

		tested.removeReference(comp);

		expect(
			tested.references.size,
			'to be',
			0
		);
	});
});
