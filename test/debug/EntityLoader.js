const { Bento, EntityLoader } = require('../../build');

const bento = new Bento();
(async () => {
	const el = new EntityLoader();
	await el.addComponent(class Test {
		name = 'test';
		async onLoad() { console.log('hello world'); }
	});

	await el.addComponent(() => ({ name: 'singleton', async onLoad() {console.log('singleton')} }));
	await el.addComponent({ name: 'singleton2', async onLoad() {console.log('singleton2')} });

	bento.addPlugin(el);

	bento.verify();
})().catch(e => {
	console.log(e);
	process.exit(1);
});