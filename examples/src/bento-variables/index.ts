
import { Bento, ComponentAPI, ConfigLoader, Variable, VariableDefinitionType } from '@ayana/bento';

import { Logger } from '@ayana/logger';
const log = Logger.get(null);

// first we start by creating a new bento instance
const bento = new Bento();

(async () => {
	// manually setting a variable
	log.info('Setting bento variable "hello" equal to "world"');
	bento.setVariable('hello', 'world');

	// using config loader plugin to map an ENV variable to a bento variable
	log.info('Mapping bento variable "foo" to env variable "BAR"');
	const config = new ConfigLoader();

	// tell config loader to do the mapping
	config.addDefinition({
		name: 'foo', // the name of the bento variable to map to
		env: 'BAR', // the name of the env variable
		value: 'TRY RUNNING THIS EXAMPLE WITH `BAR=mystring` IN FRONT', // You dont need this, just setting this to hopefully get users to test `FOO=mystring node ...`
	});

	// load config loader plugin into bento
	await bento.addPlugin(config);

	// our variable is now available!

	// How do I consume bento variables in a component?
	const log2 = Logger.get('ExampleComponent');
	class ExampleComponent {
		public api: ComponentAPI;
		public name: string = 'ExampleComponent';

		// You can either use a decorator to define the variable
		@Variable({ type: VariableDefinitionType.STRING, name: 'hello' }) // name is the name of the bento variable
		private hello: string;

		async onLoad() {
			log2.info(`Decorator defined variable "hello" = "${this.hello}"`);

			// inject variables onLoad
			this.api.injectVariable({
				type: VariableDefinitionType.STRING,
				name: 'foo', // Name of bento variable
				property: 'foo', // Property name on component to inject to
				default: 'bar', // Optional default
			});

			// IMPORTANT, by defining a varaible with a default it means even if the variable is not loaded into bento
			// it will return the default

			// or just grab it
			const foo = await this.api.getVariable('foo');
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
