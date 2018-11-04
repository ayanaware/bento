'use strict';

import { SubscriptionType } from '../constants';
import { DecoratorSubscription } from '../interfaces/internal';

export function Subscribe(type: SubscriptionType, namespace: string, name: string): MethodDecorator {
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
			type,
			namespace,
			name,
			handler: descriptor.value,
		} as DecoratorSubscription);
	};
}

export function SubscribeEvent(namespace: string, eventName: string): MethodDecorator {
	return Subscribe(SubscriptionType.EVENT, namespace, eventName);
}

export function SubscribeSubject(namespace: string, subjectName: string): MethodDecorator {
	return Subscribe(SubscriptionType.SUBJECT, namespace, subjectName);
}
