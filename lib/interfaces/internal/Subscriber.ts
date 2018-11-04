'use strict';

import { SubscriptionType } from '../../constants';

export interface Subscriber {
	handler: (...args: any[]) => void;
	name: string;
	type: SubscriptionType;
}
