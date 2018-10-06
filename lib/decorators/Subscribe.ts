'use strict';

export function Subscribe(primaryComponent: string, eventName: string): MethodDecorator {
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
			primaryComponent,
			eventName,
			listener: descriptor.value,
		});
	};
}
