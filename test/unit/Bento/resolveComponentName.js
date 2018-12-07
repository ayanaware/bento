'use strict';

const assert = require('assert');

const { Bento } = require('../../../build');

describe('#resolveComponentName', async function () {
	it('should throw an error when no name could be determined', function () {
		const bento = new Bento();

		assert.throws(
			() => bento.resolveComponentName(null),
			{ message: 'Could not determine component name' },
		);
	});

	it('should return resolved name of passed constructor', function () {
		const bento = new Bento();

		class Test {
			constructor() {
				this.name = 'TestComponent';
			}
		}

		const instance = new Test();

		bento.componentConstructors.set(instance.constructor, 'TestComponent');

		assert.strictEqual(
			bento.resolveComponentName(instance.constructor),
			'TestComponent',
			'Resolved name was not TestComponent'
		);
	});
});
