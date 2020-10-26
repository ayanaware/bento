import { EntityReference } from '../entities';
import { MetadataSymbols } from './internal';

export interface Subscriptions {
	reference: EntityReference;
	event: string;
	handler: (...args: Array<any>) => any;
}

export function getSubscriptions(target: any): Array<Subscriptions> {
	const subscriptions: Array<Subscriptions> = Reflect.getMetadata(MetadataSymbols.SUBSCRIBE, target.constructor) || [];
	if (!Array.isArray(subscriptions)) return [];

	return subscriptions;
}

export function Subscribe(reference: EntityReference, event: string): MethodDecorator {
	return function(target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<any>) {
		if (target.prototype === undefined) target = target.constructor;

		const subscriptions: Array<Subscriptions> = Reflect.getMetadata(MetadataSymbols.SUBSCRIBE, target) || [];

		subscriptions.push({ reference, event, handler: descriptor.value });

		Reflect.defineMetadata(MetadataSymbols.SUBSCRIBE, subscriptions, target);
	}
}