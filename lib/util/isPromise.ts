// I can't think of any types that might have .then and .catch so has to be unsafe any access here
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function isPromise(fn: any): boolean {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	return typeof fn === 'object' && typeof fn.then === 'function';
}
