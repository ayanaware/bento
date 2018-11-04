'use strict';

import { SubscriptionType } from '../../constants';

export interface DecoratorSubscription {
	type: SubscriptionType;
	namespace: string;
	name: string;
	handler: (...args: any[]) => void;
}
