'use strict';

import { SubscriptionType } from '../../constants';
import { Component } from '../Component';

export interface DecoratorSubscription {
	type: SubscriptionType;
	namespace: Component | string;
	name: string;
	handler: (...args: any[]) => void;
}
