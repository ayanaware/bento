'use strict';

const expect = require('unexpected');
const sinon = require('sinon');

const { ComponentManager } = require('../../../../build/managers/ComponentManager');

describe('#resolveComponentName', function () {
	const getCleanComponentManager = () => {
		const manager = new ComponentManager({});

		return manager;
	};

	it('should return the given string', function () {

	});

	it('should return resolved name of passed constructor', function () {
		const manager = getCleanComponentManager();

		class Test {
			constructor() {
				this.name = 'TestComponent';
			}
		}

		const instance = new Test();

		manager.constructors.set(instance.constructor, 'TestComponent');

		expect(
			manager.resolveName(instance.constructor),
			'to be',
			'TestComponent'
		);
	});

	it('should use the name property on the component if no constructor is registered', function () {

	});

	it('should throw an error when no name could be determined', function () {
		const manager = getCleanComponentManager();

		expect(
			() => manager.resolveName(null),
			'to throw',
			'Could not determine component name'
		);
	});
});
