'use strict';

export interface DecoratorInjection {
	propertyKey: string;
	component: string | Function | symbol;
}
