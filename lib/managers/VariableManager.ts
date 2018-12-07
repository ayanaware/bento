'use strict';

import { IllegalArgumentError, IllegalStateError } from '@ayana/errors';

import { Bento } from '../Bento';
import { ValidatorRegistrationError } from '../errors';

export class VariableManager {
	private bento: Bento;

	public readonly variables: Map<string, any> = new Map();
	public readonly validators: Map<string, (value: any, ...args: any[]) => boolean> = new Map();

	constructor(bento: Bento) {
		this.bento = bento;
	}

		/**
	 * Check if a given variable exists
	 * @param name - name of variable to get
	 */
	public hasVariable(name: string) {
		if (typeof name !== 'string') throw new IllegalArgumentError('Variable name must be a string');
		if (this.variables.has(name)) return true;
		return false;
	}

	/**
	 * Fetch a value for given variable name
	 * @param name - name of variable to get
	 */
	public getVariable(name: string) {
		if (typeof name !== 'string') throw new IllegalArgumentError('Variable name must be a string');
		if (!this.variables.has(name)) return null;
		return this.variables.get(name);
	}

	/**
	 * Update a given variables value
	 * @param name - name of variable to update
	 * @param value - new value
	 */
	public setVariable(name: string, value: any) {
		if (typeof name !== 'string') throw new IllegalArgumentError('Variable name must be a string');
		if (value === undefined) return;

		this.variables.set(name, value);
	}

	/**
	 * Fully removes all traces of a variable from bento
	 * @param name - name of variable
	 */
	public deleteVariable(name: string) {
		if (typeof name !== 'string') throw new IllegalArgumentError('Variable name must be a string');
		if (this.variables.has(name)) this.variables.delete(name);
	}

	/**
	 * Add a new validator into Bento
	 * @param name - validator name
	 * @param validator - validator function
	 */
	public addValidator(name: string, validator: (value: any, ...args: any[]) => boolean) {
		if (typeof name !== 'string') throw new IllegalArgumentError('Validator name must be a string');
		if (typeof validator !== 'function') throw new IllegalArgumentError('Validator must be a function');

		this.validators.set(name, validator);
	}

	/**
	 * Remove validator from Bento
	 * @param name - validator name
	 */
	public removeValidator(name: string) {
		if (typeof name !== 'string') throw new IllegalArgumentError('Validator name must be a string');
		if (!this.validators.has(name)) throw new IllegalStateError(`Validator "${name}" does not exist`);

		this.validators.delete(name);
	}

	/**
	 * Run a validator
	 * @param name - validator name
	 * @param args - array of args to be passed
	 */
	public runValidator(name: string, ...args: any[]) {
		if (typeof name !== 'string') throw new IllegalArgumentError('Validator name must be a string');
		if (!this.validators.has(name)) throw new IllegalStateError(`Validator "${name}" does not exist`);

		const validator = this.validators.get(name);

		try {
			return validator.call(undefined, ...args);
		} catch (e) {
			throw new ValidatorRegistrationError(name, `Validator "${name}" failed to execute`).setCause(e);
		}
	}
}
