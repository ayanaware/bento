import { IllegalArgumentError } from '@ayanaware/errors';

import { PluginAPI } from '../../entities/api/PluginAPI';
import { Plugin } from '../../entities/interfaces/Plugin';

export type VariableValue = unknown;

/**
 * A Simple Bento Variable Loader. Automatically looks to the enviorment for values.
 * If you `VariableLoader.addVariable('HELLO_WORLD')` this Plugin will automatically
 * search `process.env.HELLO_WORLD`
 */
export class VariableLoader implements Plugin {
	public name = 'VariableLoader';
	public api!: PluginAPI;

	/**
	 * Variables that this Loader is handling
	 */
	protected readonly variables: Set<string> = new Set();

	/**
	 * Variable defaults if exist
	 */
	protected readonly defaults: Map<string, VariableValue> = new Map();

	/**
	 * A cache of pending Variable Keys and Values
	 * The only purpose is a place to put values if we don't have Bento API access yet
	 */
	private readonly pending: Map<string, any> = new Map();

	// TODO: Fix this rule
	// eslint-disable-next-line @typescript-eslint/require-await
	public async onLoad(): Promise<void> {
		this.handlePending();
	}

	// TODO: Fix this rule
	// eslint-disable-next-line @typescript-eslint/require-await
	public async onUnload(): Promise<void> {
		// remove variables we loaded
		for (const key of this.variables.keys()) this.api.bento.deleteVariable(key);
	}

	private handlePending() {
		if (this.pending.size === 0) return;

		for (const [pendingKey, pendingValue] of this.pending.entries()) {
			this.api.bento.setVariable(pendingKey, pendingValue);

			this.pending.delete(pendingKey);
		}
	}

	/**
	 * Add multiple Variables
	 * @param kv String Array or Key/Value Object
	 */
	public addVariables(kv: Array<string> | { [key: string]: VariableValue }): void {
		if (typeof kv !== 'object') throw new IllegalArgumentError('kv must be an Object or Array');

		// Handle Array
		if (Array.isArray(kv)) {
			for (const key of kv) this.addVariable(key);

			return;
		}

		// Must be Object
		for (const [key, value] of Object.entries(kv)) this.addVariable(key, value);
	}

	/**
	 * Add Variable
	 * @param key Key
	 * @param value Value
	 */
	public addVariable(key: string, value?: VariableValue): void {
		if (!this.variables.has(key)) this.variables.add(key);
		this.processVariable(key, value);
	}

	/**
	 * Add multiple default values
	 * @param kv Key/Default Object
	 */
	public addDefaults(kv: { [key: string]: VariableValue }): void {
		if (typeof kv !== 'object') throw new IllegalArgumentError('Must be an Object');

		for (const [key, def] of Object.entries(kv)) this.addDefault(key, def);
	}

	/**
	 * Add Default Value for Variable
	 * @param key Key
	 * @param def Default
	 */
	public addDefault(key: string, def: VariableValue): void {
		if (!this.variables.has(key)) this.variables.add(key);
		this.defaults.set(key, def);

		this.processVariable(key);
	}

	/**
	 * Remove Variable
	 * @param key Key
	 */
	public removeVariable(key: string): void {
		if (this.variables.has(key)) this.variables.delete(key);
		if (this.defaults.has(key)) this.defaults.delete(key);

		this.unloadVariable(key);
	}

	/**
	 * Process Variable Key
	 * @param key Variable Key
	 * @param override Force variable to value
	 */
	protected processVariable(key: string, override?: VariableValue): void {
		let value: unknown = this.findVariableValue(key);
		if (value == null && this.defaults.has(key)) value = this.defaults.get(key);

		if (override !== undefined && override !== null) value = override;

		return this.loadVariable(key, value);
	}

	/**
	 * Find Variable values from underlying enviroment
	 * This function will look on `process.env` and `window`
	 * @param key Key
	 */
	protected findVariableValue(key: string): string {
		if (!this.variables.has(key)) return;
		let value = null;

		// check process.env
		if (typeof process === 'object' && process.env[key]) {
			value = process.env[key];
		}

		// TODO: check window

		return value;
	}

	/**
	 * Load Variable into Bento
	 * @param key Key
	 * @param value Value
	 */
	protected loadVariable(key: string, value: VariableValue): void {
		// PluginAPI is not yet available. Handle this gracefully
		if (!this.api) {
			this.pending.set(key, value);

			return;
		}

		// PluginAPI is available and we have pending variables. Load them now
		this.handlePending();

		this.api.bento.setVariable(key, value);
	}

	/**
	 * Unload Variable from Bento
	 * @param key Key
	 */
	protected unloadVariable(key: string): void {
		// PluginAPI is unavilable. Unlikely that variable was loaded in the first place
		if (!this.api) return;

		this.api.bento.deleteVariable(key);
	}
}
