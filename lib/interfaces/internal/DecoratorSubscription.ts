'use strict';

import { SubscriptionType } from '../../constants';

export interface DecoratorSubscription {
	type: SubscriptionType;
	namespace: string | Function;
	name: string;
	handler: (...args: any[]) => void;
}
