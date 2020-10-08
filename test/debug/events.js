const { EventEmitter } = require('events');

const { Bento } = require('../../build');
const bento = new Bento();


const forward = {
	name: 'forwardEvents',
	async onLoad() {
		this.emitter = new EventEmitter();

		this.api.forwardEvents(this.emitter, ['hello']);

		this.api.subscribe(forward, 'hello', (args) => {
			console.log('hello event:', args);
		});

		this.emitter.emit('hello', 'world');
	}
};

const p2cEmit = {
	name: 'p2cEmit',
	async onLoad() {
		this.api.emit('hello', 'hello component');
	},
};

const p2cSub = {
	name: 'p2cSub',
	async onLoad() {
		this.api.subscribe(p2cEmit, 'hello', event => console.log('--', this.name, event), this);
	},
};

const p2pEmit = {
	name: 'p2pEmit',
	async onLoad() {
		this.api.emit('hello', 'hello fellow plugin');
	},
};

const p2pSub = {
	name: 'p2pSub',
	async onLoad() {
		this.api.subscribe(p2pEmit, 'hello', event => console.log('--', this.name, event), this);
	},
}

const c2cEmit = {
	name: 'c2cEmit',
	async onLoad() {
		this.api.emit('hello', 'hello fellow component');
	},
};

const c2cSub = {
	name: 'c2cSub',
	async onLoad() {
		this.api.subscribe(c2cEmit, 'hello', event => console.log('--', this.name, event), this);
	},
};

const c2pEmit = {
	name: 'c2pEmit',
	async onLoad() {
		this.api.emit('hello', 'hello plugin');
	},
};

const c2pSub = {
	name: 'c2pSub',
	async onLoad() {
		this.api.subscribe(c2cEmit, 'hello', event => console.log('--', this.name, event), this);
	},
};

(async () => {



	await bento.addComponent(forward)

	console.log('Testing Plugin to Component Event');
	await bento.addComponent(p2cSub);
	await bento.addPlugin(p2cEmit);

	console.log('Testing Plugin to Plugin Event');
	await bento.addPlugins([p2pSub, p2pEmit]);

	console.log('Testing Component to Component Event');
	await bento.addComponent(c2cSub);
	await bento.addComponent(c2cEmit);

	console.log('Testing Component to Plugin Event (should fail)');
	await bento.addPlugin(c2pSub);
	await bento.addComponent(c2pEmit);


})().catch(e => console.log(e));
