'use strict';

import { Symbols } from '../constants/internal';

import { ComponentReference } from '../@types/ComponentReference';

export function ChildOf(component: ComponentReference): ClassDecorator {
	return function(target: any) {
		if (target[Symbols.childOf] == null) {
			Object.defineProperty(target, Symbols.childOf, {
				configurable: false,
				enumerable: false,
				writable: false,
				value: component,
			});
		}
	};
}
