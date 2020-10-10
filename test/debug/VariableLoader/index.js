const { Bento, VariableFileLoader } = require('../../../build');

const bento = new Bento();

(async () => {
	const vfl = new VariableFileLoader();
	await vfl.addDefaultsFile(__dirname, 'defaults.json');

	await bento.addPlugin(vfl);

	await bento.verify();

	console.log('Go try editing defaults.json. Add a new key. Ctrl-C to exit');

	let lastKeys = Object.keys(bento.variables.getVariables());
	console.log(lastKeys);

	while(1) {
		let currentKeys = Object.keys(bento.variables.getVariables());

		if (currentKeys.length > lastKeys.length) {
			console.log('New Variable Loaded!', currentKeys);
			lastKeys = currentKeys;
		}

		// wait 1s each pass
		await new Promise((resolve, reject) => {
			setTimeout(() => {
				resolve();
			}, 1000);
		});
	}
})().catch(e => console.log(e));