/**
 * Check if fn is indeed a class
 * 
 * @param fn Function to check
 */
export function isClass(fn: Function) {
	// Classes are a Function
	if (typeof fn !== 'function') return false;

	// Classes have both prototype & constructor
	if (!fn.prototype || !fn.constructor) return false;

    // Credit: https://github.com/miguelmota/is-class
	const sig = Function.prototype.toString.call(fn);
	if (/^class[\s{]/.test(sig)) return true;

	return false;
}
