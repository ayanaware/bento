import { EntityReference } from '../entities';
import { MetadataKeys } from './internal';

export interface Subscriptions {
	reference: EntityReference;
	event: string;
	handler: (...args: Array<any>) => any;
}

export function getSubscriptions(target: any): Array<Subscriptions> {
	const subscriptions: Array<Subscriptions> = Reflect.getMetadata(MetadataKeys.SUBSCRIBE, target.constructor) || [];
	if (!Array.isArray(subscriptions)) return [];

	return subscriptions;
}

export function Subscribe(reference: EntityReference, event: string): MethodDecorator {
	return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<any>) => {
		if (target.prototype === undefined) target = target.constructor;

		const subscriptions: Array<Subscriptions> = Reflect.getMetadata(MetadataKeys.SUBSCRIBE, target) || [];

		subscriptions.push({ reference, event, handler: descriptor.value });

		Reflect.defineMetadata(MetadataKeys.SUBSCRIBE, subscriptions, target);
	};
}
