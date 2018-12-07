'use strict';

export class Symbols {
	public static injections = Symbol('injections');
	public static runtimeIdentifier = Symbol('runtimeIdentifier');
	public static subscriptions = Symbol('subscriptions');
	public static variables = Symbol('variables');
	public static parent = Symbol('parent');
	public static childOf = Symbol('childOf');
}
