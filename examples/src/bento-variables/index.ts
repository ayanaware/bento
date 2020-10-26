
import { Bento, ComponentAPI, Variable, VariableLoader } from '@ayanaware/bento';

import { Logger } from '@ayana/logger';
const log = Logger.get(null);

// first we start by creating a new bento instance
const bento = new Bento();

(async () => {
	// manually setting a variable
	log.info('Setting bento variable "hello" equal to "world"');
	bento.setVariable('hello', 'world');

	// using variable loader plugin to map an ENV variable to a bento variable
	log.info('Mapping env variable "FOO" to bento variable "FOO"');
	const vl = new VariableLoader();
	vl.addVariable('FOO', 'Try running this example with `FOO=mystring` appended to the front')

	// load variable loader plugin into bento
	await bento.addPlugin(vl);

	// our variable is now available!

	// How do I consume bento variables in a component?
	const log2 = Logger.get('ExampleComponent');
	class ExampleComponent {
		public api: ComponentAPI;
		public name: string = 'ExampleComponent';

		// You can either use a decorator to define the variable
		@Variable({ name: 'hello' }) // name is the name of the bento variable
		private hello: string;

		async onLoad() {
			log2.info(`Decorator defined variable "hello" = "${this.hello}"`);

			// inject variables onLoad
			this.api.injectVariable({
				name: 'FOO', // Name of bento variable
				default: 'bar', // Optional default
			});

			// IMPORTANT, by defining a varaible with a default it means even if the variable is not loaded into bento
			// it will return the default

			// or just grab it
			const foo = await this.api.getVariable('FOO');
			log2.info(`Variable foo = "${foo}"`);
		}
	}

	const instance = new ExampleComponent();

	// load the component
	await bento.addComponent(instance);
})().catch(e => {
	log.error('Uh-oh it looks like this example is broken! Please let someone know.');
	log.error(e);
	process.exit(1);
});
