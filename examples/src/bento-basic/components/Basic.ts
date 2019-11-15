
import { Component, ComponentAPI } from '@ayanaware/bento';

export class Basic implements Component {
	// this property becomes available after onLoad see ComponentAPI for more info
	public api!: ComponentAPI;
	// required for all components, must be unique
	public name: string = 'Basic';

	// Optionally define other components we depend upon
	// Some decorators auto append to this array such as @Subscribe
	public dependencies: Array<Component> = [];

	// Lifecycle event, called right before component fully loaded
	public async onLoad() {
		console.log('Hello world!');
	}

	// Lifecycle event, called right before component is unloaded
	public async onUnload() {
		console.log('Goodbye world!');
	}
}