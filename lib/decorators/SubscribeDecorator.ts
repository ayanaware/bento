import { EntityReference } from '../entities';

export const SUBSCRIBE_DECORATOR_SYMBOL = Symbol('subscribeDecorator');

export interface SubscribeDecoratorInjection {
	reference: EntityReference;
	eventName: string;
	handler: (...args: Array<any>) => void;
}

export function getSubscribeDecoratorInjections(target: any): Array<SubscribeDecoratorInjection> {
	if (target.constructor == null) return [];

	const subscriptions: Array<SubscribeDecoratorInjection> = target.constructor[SUBSCRIBE_DECORATOR_SYMBOL];
	if (!Array.isArray(subscriptions)) return [];

	return subscriptions;
}

export function Subscribe(reference: EntityReference, eventName: string): MethodDecorator {
	return function(target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<any>) {
		if (target.prototype !== undefined) throw new Error(`"${target.name}#${String(propertyKey)}": Subscribe can only be applied to non-static methods`);

		if (target.constructor[SUBSCRIBE_DECORATOR_SYMBOL] == null) {
			Object.defineProperty(target.constructor, SUBSCRIBE_DECORATOR_SYMBOL, {
				configurable: false,
				enumerable: false,
				writable: false,
				value: [],
			});
		}

		target.constructor[SUBSCRIBE_DECORATOR_SYMBOL].push({
			reference,
			eventName,
			handler: descriptor.value,
		} as SubscribeDecoratorInjection);
	};
}

export function SubscribeEvent(reference: EntityReference, eventName: string): MethodDecorator {
	console.warn(`The @SubscribeEvent Decorator is deprecated. Please use @Subscribe. (eventName = ${eventName})`);

	return Subscribe(reference, eventName);
}
