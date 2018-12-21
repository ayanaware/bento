'use strict';

import { Symbols } from '../constants/internal';

export function ChildOf(component: string | Function): ClassDecorator {
	return function (target: any) {
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
