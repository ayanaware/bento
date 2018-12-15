'use strict';

const expect = require('unexpected');
const sinon = require('sinon');

const { PropertyManager } = require('../../../../build/managers/PropertyManager');

describe('#setProperty', function () {
	const getClean = () => {
		const tested = new PropertyManager({});

		return tested;
	};

	it('should add all properties given', function () {
		const tested = getClean();

		tested.setProperty = sinon.fake();

		const properties = {
			A: 'B',
			C: true,
			D: function () {},
		};

		tested.setProperties(properties);

		sinon.assert.calledThrice(tested.setProperty);

		let index = 0;
		for (const [name, value] of Object.entries(properties)) {
			expect(
				tested.setProperty.args[index][0],
				'to be',
				name
			);

			expect(
				tested.setProperty.args[index][1],
				'to be',
				value
			);

			index++;
		}
	});
});
