import { EntityReference } from '../entities/types/EntityReference';

const SUBSCRIBE_KEY = '@ayanaware/bento:Subscribe';

export interface Subscriptions {
	reference: EntityReference;
	event: string;
	handler: (...args: Array<any>) => any;
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function getSubscriptions(target: Function): Array<Subscriptions> {
	const subscriptions = Reflect.getMetadata(SUBSCRIBE_KEY, target) as Array<Subscriptions>;
	if (!Array.isArray(subscriptions)) return [];

	return subscriptions;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export function Subscribe(reference: EntityReference, event: string): MethodDecorator {
	return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<any>) => {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
		if (target.prototype === undefined) target = target.constructor;

		const subscriptions = Reflect.getMetadata(SUBSCRIBE_KEY, target) as Array<Subscriptions> || [];
		subscriptions.push({ reference, event, handler: descriptor.value as (...args: Array<any>) => any });

		Reflect.defineMetadata(SUBSCRIBE_KEY, subscriptions, target);
	};
}
