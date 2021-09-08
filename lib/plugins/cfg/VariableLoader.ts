import { IllegalArgumentError } from '@ayanaware/errors';

import { PluginAPI } from '../../entities/api/PluginAPI';
import { Plugin } from '../../entities/interfaces/Plugin';

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
	protected readonly defaults: Map<string, unknown> = new Map();

	/**
	 * A cache of pending Variable Keys and Values
	 * The only purpose is a place to put values if we don't have Bento API access yet
	 */
	private readonly pending: Map<string, any> = new Map();

	public async onLoad(): Promise<void> {
		this.handlePending();
	}

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
	public addVariables(kv: Array<string> | { [key: string]: unknown }): void {
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
	public addVariable<T = unknown>(key: string, value?: T): void {
		if (!this.variables.has(key)) this.variables.add(key);
		this.processVariable(key, value);
	}

	/**
	 * Add multiple default values
	 * @param kv Key/Default Object
	 */
	public addDefaults(kv: { [key: string]: unknown }): void {
		if (typeof kv !== 'object') throw new IllegalArgumentError('Must be an Object');

		for (const [key, def] of Object.entries(kv)) this.addDefault(key, def);
	}

	/**
	 * Add Default Value for Variable
	 * @param key Key
	 * @param def Default
	 */
	public addDefault<T = unknown>(key: string, def: T): void {
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
	 * Get variable value, from underlying eniroment
	 *
	 * Note: This function will look on `process.env` and `window`
	 * @param key Key
	 */
	protected getVariableValue(key: string): string {
		if (!this.variables.has(key)) return null;
		let value: string;

		// check process.env
		if (typeof process === 'object' && process.env[key]) {
			value = process.env[key];
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		} else if (typeof window !== 'undefined' && (window as any)[key]) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
			value = (window as any)[key];
		}

		return value;
	}

	/**
	 * Process Variable Key
	 * @param key Variable Key
	 */
	protected processVariable<T = unknown>(key: string, override?: T): void {
		let value: unknown = this.getVariableValue(key);
		if (value === undefined && this.defaults.has(key)) value = this.defaults.get(key).toString();
		if (override !== undefined) value = override;

		return this.loadVariable(key, value);
	}

	/**
	 * Load Variable into Bento
	 * @param key Key
	 * @param value Value
	 */
	protected loadVariable<T = unknown>(key: string, value: T): void {
		// PluginAPI is not yet available. Handle this gracefully
		if (!this.api) {
			this.pending.set(key, value);

			return;
		}

		// PluginAPI is available and we have pending variables. Load them now
		this.handlePending();

		this.api.bento.setVariable<T>(key, value);
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
