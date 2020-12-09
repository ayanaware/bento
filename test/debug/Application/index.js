const { Application } = require('../../../build');

const app = new Application({ name: 'test' });

(async () => {
	await app.start();

	const state = await app.verify();
	console.log(state);
})().catch(e => {
	console.error(e);
});