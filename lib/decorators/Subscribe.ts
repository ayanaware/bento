'use strict';

import { ComponentReference } from '../references';

import { SubscriptionType } from '../components/SubscriptionType';

import { DecoratorSubscription, DecoratorSymbols } from './internal';

export function Subscribe(type: SubscriptionType, reference: ComponentReference, name: string): MethodDecorator {
	return function(target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<any>) {
		if(target.prototype !== undefined) {
			throw new Error(`The subscribe decorator can only be applied to non-static class methods ("${propertyKey}" in class "${target.name}")`);
		}

		if (target.constructor[DecoratorSymbols.subscriptions] == null) {
			Object.defineProperty(target.constructor, DecoratorSymbols.subscriptions, {
				configurable: false,
				enumerable: false,
				writable: false,
				value: [],
			});
		}

		target.constructor[DecoratorSymbols.subscriptions].push({
			type,
			namespace: reference,
			name,
			handler: descriptor.value,
		} as DecoratorSubscription);
	};
}

export function SubscribeEvent(reference: ComponentReference, eventName: string): MethodDecorator {
	return Subscribe(SubscriptionType.EVENT, reference, eventName);
}

export function SubscribeSubject(reference: ComponentReference, subjectName: string): MethodDecorator {
	return Subscribe(SubscriptionType.SUBJECT, reference, subjectName);
}
