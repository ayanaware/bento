'use strict';

const { ComponentManager } = require('../../../../build/managers/ComponentManager');

describe('#getMissingDependencies', function() {
	const getClean = () => {
		const tested = new ComponentManager({});

		tested.references = {};

		tested.resolveName = sinon.fake.returns(null);

		return tested;
	};

	it('should throw an error if not an object', function() {
		expect(
			() => getClean().getMissingDependencies('Totally an object'),
			'to throw',
			'Component must be an object',
		);
	});

	it('should throw an error if object has no dependencies property', function() {
		expect(
			() => getClean().getMissingDependencies({ name: 'test' }),
			'to throw',
			'Component dependencies must be an array',
		);
	});

	it('should return an array', function() {
		const tested = getClean();

		expect(
			tested.getMissingDependencies({ dependencies: [] }),
			'to be an array'
		);
	});

	it('should return a list of components not currently loaded, requested by provided component', function() {
		const tested = getClean();

		tested.components.set('A', {});
		tested.components.set('B', {});

		// figure out how to use sinon for this
		tested.resolveName = name => name;

		// Dependencies are returned by resolveDependencies
		const missing = tested.getMissingDependencies({ dependencies: ['A', 'B', 'C', 'D'] });

		expect(
			missing,
			'not to contain',
			'A', 'B'
		);

		expect(
			missing,
			'to contain',
			'C', 'D'
		);
	});
});
