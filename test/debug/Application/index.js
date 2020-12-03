const { Application } = require('../../../build');

(async () => {
	const app = new Application({ name: 'test' });

	const state = await app.start();

	console.log(state);
})().catch(e => {
	console.error(e);
});