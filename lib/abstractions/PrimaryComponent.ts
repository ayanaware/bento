'use strict';

import { SecondaryComponent } from './SecondaryComponent';

interface PrimaryOptions {
	required?: boolean;
	dependencies?: string[];
}

export class PrimaryComponent implements SecondaryComponent {
	public readonly name: string;
	public readonly required: boolean;
	public readonly dependencies: string[];

	constructor(name: string, options?: PrimaryOptions) {
		if (typeof name !== 'string' || name.trim().length === 0) throw new Error(`Invalid primary component name "${name}"`);

		if (options.required != null && typeof options.required !== 'boolean') throw new Error(`Invalid primary component required state "${options.required}"`);

		if (options.dependencies != null) {
			if (!Array.isArray(options.dependencies)) throw new Error(`Invalid primary component dependencies "${options.dependencies}"`);

			Object.freeze(options.dependencies);
		}

		Object.defineProperty(this, 'name', {
			configurable: true,
			writable: false,
			enumerable: true,
			value: name,
		});

		if (options.required != null) {
			Object.defineProperty(this, 'required', {
				configurable: true,
				writable: false,
				enumerable: true,
				value: options.required,
			});
		}

		if (options.dependencies != null) {
			Object.defineProperty(this, 'dependencies', {
				configurable: true,
				writable: false,
				enumerable: true,
				value: options.dependencies,
			});
		}
	}
}
