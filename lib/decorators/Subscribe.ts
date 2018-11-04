'use strict';

export interface DecoratorSubscription {
	namespace: string;
	name: string;
	isSubject: boolean;
	handler: (...args: any[]) => void;
}

export function Subscribe(namespace: string, eventName: string): MethodDecorator {
	return function (target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<any>) {
		if(target.prototype !== undefined) {
			throw new Error(`The subscribe decorator can only be applied to non-static class methods ("${propertyKey}" in class "${target.name}")`);
		}

		if (target.constructor._subscriptions == null) {
			Object.defineProperty(target.constructor, '_subscriptions', {
				configurable: false,
				enumerable: false,
				writable: false,
				value: [],
			});
		}

		target.constructor._subscriptions.push({
			namespace,
			name: eventName,
			isSubject: false,
			handler: descriptor.value,
		} as DecoratorSubscription);
	};
}
