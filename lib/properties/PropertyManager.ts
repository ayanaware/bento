import { IllegalArgumentError } from '@ayanaware/errors';

export class PropertyManager {
	private readonly properties: Map<string, unknown> = new Map();

	/**
	 * Checks if a given property exists in bento
	 * @param name property name
	 *
	 * @returns boolean
	 */
	public hasProperty(name: string): boolean {
		if (typeof name !== 'string') throw new IllegalArgumentError('Property name must be a string');

		return this.properties.has(name);
	}

	/**
	 * Fetch a value for given application property
	 * @param name name of variable to get
	 *
	 * @returns Property value
	 */
	public getProperty<T>(name: string): T {
		if (typeof name !== 'string') throw new IllegalArgumentError('Property name must be a string');

		return this.properties.get(name) as T;
	}

	/**
	 * Update a given application property value
	 * @param name name of variable to update
	 * @param value new value
	 */
	public setProperty<T>(name: string, value: T): T {
		if (typeof name !== 'string') throw new IllegalArgumentError('Property name must be a string');

		this.properties.set(name, value);
		return value;
	}

	/**
	 * Define multiple application properties at once
	 * @param properties SetProperties object
	 */
	public setProperties(properties: { [key: string]: any }): void {
		for (const [name, value] of Object.entries(properties)) {
			this.setProperty(name, value);
		}
	}
}
