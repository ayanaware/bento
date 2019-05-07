'use strict';

import { DecoratorSymbols } from './internal';

import { ComponentReference } from '../references';

export function ChildOf(component: ComponentReference): ClassDecorator {
	return function(target: any) {
		if (target[DecoratorSymbols.childOf] == null) {
			Object.defineProperty(target, DecoratorSymbols.childOf, {
				configurable: false,
				enumerable: false,
				writable: false,
				value: component,
			});
		}
	};
}
