'use strict';

import { Symbols } from '../constants/internal';

export function ChildOf(component: string | any): ClassDecorator {
	return function (target: any) {
		if (target.constructor[Symbols.childOf] == null) {
			Object.defineProperty(target.constructor, Symbols.childOf, {
				configurable: false,
				enumerable: false,
				writable: false,
				value: component,
			});
		}
	};
}
