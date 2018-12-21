'use strict';

export interface DecoratorInjection {
	propertyKey: string;
	component?: string | Function;
	symbol?: symbol;
}

export interface DecoratorComponentInjection extends DecoratorInjection {
	component: string | Function;
	symbol: never;
}

export interface DecoratorSymbolInjection extends DecoratorInjection {
	component: never;
	symbol: symbol;
}
