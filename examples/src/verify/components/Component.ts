import { Component, ComponentAPI } from '@ayanaware/bento';
import { Logger } from '@ayanaware/logger';
import { LoadsSecond } from './LoadsSecond';
const log = Logger.get('ExampleComponent');

export class ExampleComponent implements Component {
	public api: ComponentAPI;
	public name: string = 'ExampleComponent';

	public async onLoad() {
		log.info('Hello world!');

		console.log('onLoad call:');
		this.iShouldOnlyRunAfterEverythingisLoaded();
	}

	private async iShouldOnlyRunAfterEverythingisLoaded() {
		let entity = null;
		try {
			entity = this.api.getEntity(LoadsSecond);
		} catch {}

		console.log('result =', entity);
	}

	public async onVerify() {
		console.log('onVerify call:');
		return this.iShouldOnlyRunAfterEverythingisLoaded();
	}
}
