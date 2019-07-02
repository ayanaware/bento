'use strict';

import { SubscriptionType } from '../../components/SubscriptionType';

export interface Subscriber {
	handler: (...args: any[]) => void;
	name: string;
	type: SubscriptionType;
}
