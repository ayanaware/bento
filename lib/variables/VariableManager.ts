import { IllegalArgumentError, IllegalStateError } from '@ayanaware/errors';

import { ValidatorRegistrationError } from '../errors/ValidatorRegistrationError';

export class VariableManager {
	private readonly variables: Map<string, unknown> = new Map();
	private readonly validators: Map<string, (value: any, ...args: Array<any>) => boolean> = new Map();

	/**
	 * Check if a given variable exists
	 * @param name name of variable
	 *
	 * @returns boolean
	 */
	public hasVariable(name: string): boolean {
		if (typeof name !== 'string') throw new IllegalArgumentError('Variable name must be a string');
		if (this.variables.has(name)) return true;

		return false;
	}

	/**
	 * Fetch a value for a given variable name
	 * @param name name of variable
	 * @param def default value
	 *
	 * @returns variable value
	 */
	public getVariable<T = string>(name: string, def?: T): T {
		if (typeof name !== 'string') throw new IllegalArgumentError('Variable name must be a string');

		const value = this.variables.get(name);
		if (value === undefined && def !== undefined) return def;

		return value as T;
	}

	/**
	 * Get Key/Value Object of all variables
	 *
	 * @returns Object of Key/Value pairs
	 */
	public getVariables(): Record<string, unknown> {
		return Array.from(this.variables.entries()).reduce((a: Record<string, unknown>, [k, v]) => {
			a[k] = v;

			return a;
		}, {});
	}

	/**
	 * Update a given variables value
	 * @param name name of variable
	 * @param value new value
	 */
	public setVariable<T = string>(name: string, value: T): T {
		if (typeof name !== 'string') throw new IllegalArgumentError('Variable name must be a string');
		if (value === undefined) return;

		this.variables.set(name, value);
		return value;
	}

	/**
	 * Fully removes all traces of a variable from bento
	 * @param name name of variable
	 */
	public deleteVariable(name: string): void {
		if (typeof name !== 'string') throw new IllegalArgumentError('Variable name must be a string');
		if (this.variables.has(name)) this.variables.delete(name);
	}

	/**
	 * Add a new validator into Bento
	 * @param name validator name
	 * @param validator validator function
	 */
	public addValidator(name: string, validator: (value: any, ...args: Array<any>) => boolean): void {
		if (typeof name !== 'string') throw new IllegalArgumentError('Validator name must be a string');
		if (typeof validator !== 'function') throw new IllegalArgumentError('Validator must be a function');

		this.validators.set(name, validator);
	}

	/**
	 * Remove validator from Bento
	 * @param name validator name
	 */
	public removeValidator(name: string): void {
		if (typeof name !== 'string') throw new IllegalArgumentError('Validator name must be a string');
		if (!this.validators.has(name)) throw new IllegalStateError(`Validator "${name}" does not exist`);

		this.validators.delete(name);
	}

	/**
	 * Run a validator
	 * @param name validator name
	 * @param value validator value
	 * @param args array of args to be passed
	 *
	 * @returns validator result
	 */
	public runValidator(name: string, value: unknown, ...args: Array<any>): boolean {
		if (typeof name !== 'string') throw new IllegalArgumentError('Validator name must be a string');
		if (!this.validators.has(name)) throw new IllegalStateError(`Validator "${name}" does not exist`);

		const validator = this.validators.get(name);

		try {
			return validator.call(undefined, value, args);
		} catch (e) {
			throw new ValidatorRegistrationError(name, `Validator "${name}" failed to execute`).setCause(e);
		}
	}
}
