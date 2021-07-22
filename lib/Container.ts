export type ContainedType<T> = { new(...args: Array<any>) : T } | Function;

/**
 * This is a IOC Container for internal Bento use
 * Prevents the need for messy instance passing and class instantiation.
 */

const instances: Array<{ type: Function, object: any }> = [];
export function getInstance<T>(someClass: ContainedType<T>, ...args: Array<any>): T {
	let instance = instances.find(i => i.type === someClass);
	if (!instance) {
		instance = { type: someClass, object: new (someClass as new (...args: Array<any>) => T)(...args) };
		instances.push(instance);
	}

	return instance.object;
}
