'use strict';

import { SubscriptionType } from '../../constants';
import { PrimaryComponent } from '../PrimaryComponent';

export interface DecoratorSubscription {
	type: SubscriptionType;
	namespace: PrimaryComponent | string;
	name: string;
	handler: (...args: any[]) => void;
}
