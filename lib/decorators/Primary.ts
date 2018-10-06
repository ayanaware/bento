'use strict';

export interface PrimaryOptions {
	name: string;
	required?: boolean;
	dependencies?: string[];
}

export function Primary(nameOrOptions: string | PrimaryOptions): ClassDecorator {
	let options: PrimaryOptions;
	if (typeof nameOrOptions === 'string') {
		options = { name: nameOrOptions };
	} else {
		options = nameOrOptions;
	}

	if (typeof options.name !== 'string' || options.name.trim().length === 0) throw new Error(`Invalid primary component name "${options.name}"`);

	if (options.required != null && typeof options.required !== 'boolean') throw new Error(`Invalid primary component required state "${options.required}"`);

	if (options.dependencies != null) {
		if (!Array.isArray(options.dependencies)) throw new Error(`Invalid primary component dependencies "${options.dependencies}"`);

		Object.freeze(options.dependencies);
	}

	return function (constructor: Function) {
		Object.defineProperty(constructor.prototype, 'name', {
			configurable: true,
			writable: false,
			enumerable: true,
			value: options.name,
		});

		if (options.required != null) {
			Object.defineProperty(constructor.prototype, 'required', {
				configurable: true,
				writable: false,
				enumerable: true,
				value: options.required,
			});
		}

		if (options.dependencies != null) {
			Object.defineProperty(constructor.prototype, 'dependencies', {
				configurable: true,
				writable: false,
				enumerable: true,
				value: options.dependencies,
			});
		}
	};
}
