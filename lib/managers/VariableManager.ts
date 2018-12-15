'use strict';

import { IllegalArgumentError, IllegalStateError } from '@ayana/errors';

import { Bento } from '../Bento';
import { ValidatorRegistrationError } from '../errors';
import { VariableSource, VariableSourceType } from '../interfaces';

export class VariableManager {
	private bento: Bento;

	private readonly variables: Map<string, any> = new Map();
	private readonly validators: Map<string, (value: any, ...args: any[]) => boolean> = new Map();

	private readonly sources: Map<string, VariableSource[]> = new Map();

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

		// purge source
		if (this.sources.has(name)) this.sources.delete(name);
	}

	/**
	 * Fetches source information for a given variable
	 * @param name - Variable name
	 */
	// TODO: Needs tests
	public getSources(name: string) {
		if (typeof name !== 'string') throw new IllegalArgumentError('Name must be a string');
		if (!this.sources.has(name)) throw new IllegalStateError(`Variable "${name}" has no defined sources`);

		return this.sources.get(name);
	}

	/**
	 * Sets source information for a given variable name
	 * @param name - Variable name
	 * @param source - VariableSource
	 */
	// TODO: Needs tests
	public setSources(name: string, sources: VariableSource[]) {
		if (typeof name !== 'string' || name === '') throw new IllegalArgumentError('Variable name must be a string');
		if (!Array.isArray(sources)) throw new IllegalArgumentError('Sources must be an array');

		for (const source of sources) {
			this.addSource(name, source);
		}
	}

	public addSource(name: string, source: VariableSource) {
		if (typeof name !== 'string' || name === '') throw new IllegalArgumentError('Variable name must be a string');
		if (!this.variables.has(name)) throw new IllegalStateError(`Source can not be set for undefined variable "${name}"`);

		if (source == null || typeof source !== 'object') throw new IllegalArgumentError('VariableSource must be a object');

		if (['env', 'inline'].indexOf(source.type) === -1) throw new IllegalArgumentError('Invalid VariableSource type');

		if (source.type === VariableSourceType.ENV) {
			if (source.source == null) throw new IllegalArgumentError(`VariableSource of type "${source.type}" requires source to be a valid string`);
		}

		let sources = this.sources.get(name);
		if (!Array.isArray(sources)) sources = [];

		sources.push(source);
		this.sources.set(name, sources);
	}

	/**
	 * Delete source information for a given variable name
	 * @param name - Variable name
	 */
	public deleteSources(name: string) {
		if (typeof name !== 'string') throw new IllegalArgumentError('Name must be a string');
		if (!this.sources.has(name)) throw new IllegalStateError(`No sources found for variable "${name}"`);

		this.sources.delete(name);
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
