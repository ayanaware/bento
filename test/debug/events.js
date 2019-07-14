
const { EventEmitter } = require('events');

const { Bento } = require('../../build');
const bento = new Bento();

const componentOne = {
	name: 'one',
	async onLoad() {
		this.emitter = new EventEmitter();

		this.api.forwardEvents(this.emitter, ['hello']);

		this.api.subscribe('one', 'hello', (args) => {
			console.log('hello event:', args);
		});

		this.emitter.emit('hello', 'world');
	}
};

bento.addComponent(componentOne).catch(() => {
	console.log('dead');
})
