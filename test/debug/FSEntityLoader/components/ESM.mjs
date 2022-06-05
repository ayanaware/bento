
// @fs-entity
export class ESM {
	name = 'ESM';

	async onLoad() {
		console.log('Hello from a ES Module');
	}
}
export default ESM;

export function test() {
	console.log('Function test');
}