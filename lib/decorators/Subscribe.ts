'use strict';

import { SubscriptionType } from '../constants';
import { Symbols } from '../constants/internal';
import { DecoratorSubscription } from '../interfaces/internal';

import { ComponentReference } from '../@types/ComponentReference';

export function Subscribe(type: SubscriptionType, reference: ComponentReference, name: string): MethodDecorator {
	return function(target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<any>) {
		if(target.prototype !== undefined) {
			throw new Error(`The subscribe decorator can only be applied to non-static class methods ("${String(propertyKey)}" in class "${target.name}")`);
		}

		if (target.constructor[Symbols.subscriptions] == null) {
			Object.defineProperty(target.constructor, Symbols.subscriptions, {
				configurable: false,
				enumerable: false,
				writable: false,
				value: [],
			});
		}

		target.constructor[Symbols.subscriptions].push({
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
