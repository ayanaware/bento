'use strict';

import { SubscriptionType } from '../../../components/SubscriptionType';

export interface DecoratorSubscription {
	type: SubscriptionType;
	namespace: string | Function;
	name: string;
	handler: (...args: any[]) => void;
}
