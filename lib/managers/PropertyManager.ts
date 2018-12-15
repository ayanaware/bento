'use strict';

import { IllegalArgumentError } from '@ayana/errors';

import { Bento } from '../Bento';

export interface SetProperties {
	[key: string]: any;
}

export class PropertyManager {
	private readonly bento: Bento;

	private readonly properties: Map<string, any> = new Map();

	constructor(bento: Bento) {
		this.bento = bento;
	}

	public hasProperty(name: string) {
		if (typeof name !== 'string') throw new IllegalArgumentError('Property name must be a string');
		if (this.properties.has(name)) return true;
		return false;
	}

	/**
	 * Fetch a value for given application property
	 * @param name - name of variable to get
	 */
	public getProperty(name: string) {
		if (typeof name !== 'string') throw new IllegalArgumentError('Property name must be a string');
		if (!this.properties.has(name)) return null;
		return this.properties.get(name);
	}

	/**
	 * Update a given application property value
	 * @param name -name of variable to update
	 * @param value - new value
	 */
	public setProperty(name: string, value: any) {
		if (typeof name !== 'string') throw new IllegalArgumentError('Property name must be a string');
		this.properties.set(name, value);
	}

	/**
	 * Define multiple application properties at once
	 * @param properties - SetProperties object
	 */
	public setProperties(properties: SetProperties) {
		for (const [name, value] of Object.entries(properties)) {
			this.setProperty(name, value);
		}
	}
}
