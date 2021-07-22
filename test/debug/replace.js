const { Bento } = require('../../build');

class Old {
	name = 'old';
	replaceable = true;
}

class Dependent {
	name = 'dependent'
	dependencies = [Old];

	async onLoad() {
		console.log('this.api.getComponent(Old) = ', this.api.getComponent(Old));
	}
}

class New extends Old {
	name = 'hello';
	replaceable = true;
}

class Replacetwo extends Old { name = 'world' }

(async () => {
	const bento = new Bento();
	await bento.addComponent(Old);
	await bento.addComponent(Dependent);

	await bento.replaceComponent(Old, New)
	await bento.replaceComponent(New, Replacetwo);

	console.log(bento.entities);
})().catch(e => { console.log(e) });
