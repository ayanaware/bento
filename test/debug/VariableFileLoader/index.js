const { Bento, VariableFileLoader } = require('../../../build');

const bento = new Bento();

(async () => {
	const vfl = new VariableFileLoader(true);
	await vfl.addFile([__dirname, 'defaults.json'], true);
	await vfl.addFile([__dirname, 'values.json']);

	await bento.addPlugin(vfl);

	await bento.verify();

	console.log('Go try editing defaults.json. Update a Value. Add a new key. Whatever Ctrl-C to exit');

	while (1) {
		console.log(bento.variables.getVariables());

		// wait 1s each pass
		await new Promise(resolve => {
			setTimeout(() => {
				resolve();
			}, 1000);
		});
	}
})().catch(e => console.log(e));
