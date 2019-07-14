
import { ComponentReference } from '../references';

import { DecoratorSubscription, DecoratorSymbols } from './internal';

export function Subscribe(reference: ComponentReference, name: string): MethodDecorator {
	return function(target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<any>) {
		if (target.prototype !== undefined) {
			throw new Error(`The subscribe decorator can only be applied to non-static class methods ("${String(propertyKey)}" in class "${target.name}")`);
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
			namespace: reference,
			name,
			handler: descriptor.value,
		} as DecoratorSubscription);
	};
}

export function SubscribeEvent(reference: ComponentReference, eventName: string): MethodDecorator {
	return Subscribe(reference, eventName);
}
