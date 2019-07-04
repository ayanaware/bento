'use strict';

export interface DecoratorSubscription {
	namespace: string | Function;
	name: string;
	handler: (...args: any[]) => void;
}
