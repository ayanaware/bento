
import { ComponentAPI } from '@ayana/bento';

export class Basic {
	// This doesn't need to be set to anything. Bento makes it available in onLoad()
	public api: ComponentAPI;
	public name: string = 'Basic';

	public async onLoad() {
		console.log(`Hello world`);
	}
}
