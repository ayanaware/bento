'use strict';

import 'reflect-metadata';

export interface SubscriptionMeta {
	primaryComponent: string;
	eventName: string;
	listener: (...args: any[]) => any;
}

export class Meta {

	public static getSubscriptions(target: any): SubscriptionMeta[] {
		return Reflect.getMetadata('subscriptions', target) || [];
	}

	public static setSubscriptions(target: any, subscriptions: SubscriptionMeta[]) {
		Reflect.defineMetadata('subscriptions', subscriptions, target);
	}

}
