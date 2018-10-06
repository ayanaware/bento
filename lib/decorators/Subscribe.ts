'use strict';

import { Meta } from './Meta';

export function Subscribe(primaryComponent: string, eventName: string): MethodDecorator {
	return function (target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<any>) {
		if(target.prototype !== undefined) {
			throw new Error(`The subscribe decorator can only be applied to non-static class methods ("${propertyKey}" in class "${target.name}")`);
		}

		const subscriptions = Meta.getSubscriptions(target);

		subscriptions.push({
			primaryComponent,
			eventName,
			listener: descriptor.value,
		});

		Meta.setSubscriptions(target, subscriptions);
	};
}
