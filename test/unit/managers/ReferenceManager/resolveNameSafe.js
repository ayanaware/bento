'use strict';

const { ReferenceManager } = require('../../../../build/managers/ReferenceManager');

describe('#resolveNameSafe', function () {
	const getClean = () => {
		const tested = new ReferenceManager();

		return tested;
	};

	it('should return the given string', function () {
		const tested = getClean();

		expect(
			tested.resolveNameSafe('TestComponent'),
			'to be',
			'TestComponent'
		);
	});

	it('should return the resolved name of the passed constructor', function () {
		const tested = getClean();

		class Test {}

		tested.references.set(Test, 'TestComponent');

		expect(
			tested.resolveNameSafe(Test),
			'to be',
			'TestComponent'
		);
	});

	it('should return the name of a passed component', function () {
		const tested = getClean();

		class Test {
			constructor() {
				this.name = 'TestComponent';
			}
		}

		const test = new Test();

		expect(
			tested.resolveNameSafe(test),
			'to be',
			'TestComponent'
		);
	});

	it('should return null when no name could be determined', function () {
		const tested = getClean();

		expect(
			tested.resolveNameSafe({}),
			'to be null'
		);
	});

	it('should return null when null or undefined is passed', function () {
		const tested = getClean();

		expect(
			tested.resolveNameSafe(null),
			'to be null'
		);

		expect(
			tested.resolveNameSafe(undefined),
			'to be null'
		);
	});
});
