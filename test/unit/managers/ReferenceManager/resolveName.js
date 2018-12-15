'use strict';

const expect = require('unexpected');

const { ReferenceManager } = require('../../../../build/managers/ReferenceManager');

describe('#resolveName', function () {
	const getClean = () => {
		const tested = new ReferenceManager();

		return tested;
	};

	it('should return the given string', function () {
		const tested = getClean();

		expect(
			tested.resolveName('TestComponent'),
			'to be',
			'TestComponent'
		);
	});

	it('should return the resolved name of the passed constructor', function () {
		const tested = getClean();

		class Test {}

		tested.references.set(Test, 'TestComponent');

		expect(
			tested.resolveName(Test),
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
			tested.resolveName(test),
			'to be',
			'TestComponent'
		);
	});

	it('should throw an error when no name could be determined', function () {
		const tested = getClean();

		expect(
			() => tested.resolveName({}),
			'to throw',
			'Given entity or reference is invalid, not registered or does not have a name'
		);
	});

	it('should throw an error when null or undefined is passed', function () {
		const tested = getClean();

		expect(
			() => tested.resolveName(null),
			'to throw',
			'Given entity or reference is invalid, not registered or does not have a name'
		);

		expect(
			() => tested.resolveName(undefined),
			'to throw',
			'Given entity or reference is invalid, not registered or does not have a name'
		);
	});
});
