'use strict';

/*
		This example teaches you how Bento variables work.
	A bento Variable is a configurable piece of information for
	your application to consume. You can set them manually or use a
	plugin like ConfigLoader to dynamically load them from various
	places like env or a file
*/

import { Bento, ComponentAPI, ConfigLoader, Variable } from '@ayana/bento';

import { Logger } from '@ayana/logger';
const log = Logger.get('null');

// first we start by creating a new bento instance
const bento = new Bento();

(async () => {
	// manually setting a variable
	log.info('Setting bento variable "hello" equal to "world"');
	bento.setVariable('hello', 'world');

	// using config loader plugin to map an ENV variable to a bento variable
	log.info('Mapping bento variable "foo" to env variable "bar"');

	// tell config loader to do the mapping
	const config = new ConfigLoader();
	config.addDefinition({
		name: 'foo', // the name of the bento variable to map to
		env: 'BAR', // the name of the env variable
		value: 'Try running this command with FOO=mystring in front', // You dont need this, just setting this to hopefully get users to test `FOO=mystring node ...`
	});

	// load config loader into bento
	await bento.addPlugin(config);

	// our variable is now available!

	// How do I consume bento variables in a component?
	const log2 = Logger.get('ExampleComponent');
	class ExampleComponent {
		public api: ComponentAPI;
		public name: string = 'ExampleComponent';

		// You can either use a decorator to define the variable
		@Variable({ type: 'string', name: 'hello' }) // name is the name of the bento variable
		private hello: string;

		async onLoad() {
			log2.info(`Component property hello (mapped to bento variable hello) = ${this.hello}`);

			// define it in onLoad

			// or grab it in onLoad
			const foo = await this.api.getVariable('foo');
			log2.info(`Variable foo = ${foo}`);
		}
	}
})().catch(e => {
	log.error('Uh-oh it looks like this example is broken! Please let someone know.');
	console.log(e);
});
