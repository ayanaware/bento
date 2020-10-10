import { IllegalArgumentError } from '@ayanaware/errors';
import { Plugin, PluginAPI } from '../../entities';

/**
 * A Simple Bento Variable Loader. Automatically looks to the enviorment for values.
 * If you `VariableLoader.addVariable('HELLO_WORLD')` this Plugin will automatically
 * search `process.env.HELLO_WORLD`
 */
export class VariableLoader implements Plugin {
	public name = 'VariableLoader';
	public api!: PluginAPI

	/**
	 * Variables that this Loader is handling and their defaults
	 */
	protected readonly variables: Map<string, any> = new Map();

	/**
	 * A cache of pending Variable Keys and Values
	 * The only purpose is a place to put values if we don't have Bento API access yet
	 */
	private readonly pending: Map<string, any> = new Map();
	
	public async onLoad() {
		this.handlePending();
	}

	public async onUnload() {
		// remove variables we loaded
		for (const key of this.variables.keys()) this.api.bento.deleteVariable(key);
	}

	private handlePending() {
		if (this.pending.size == 0) return;

		for (const [pendingKey, pendingValue] of this.pending.entries()) {
			this.api.bento.setVariable(pendingKey, pendingValue);

			this.pending.delete(pendingKey);
		}
	}

	/**
	 * Add multiple variables at once
	 * @param kv String Array or Key/Value Object
	 */
	public addVariables(kv: Array<string> | {[key: string]: any}) {
		if (typeof kv !== 'object') throw new IllegalArgumentError('kv must be an Object or Array');

		if (Array.isArray(kv)) {
			for (const key of kv) this.addVariable(key);

			return;
		}

		for (const [key, value] of Object.entries(kv)) this.addVariable(key, value);

		return this;
	}

	/**
	 * Add Variable
	 * @param key Key
	 * @param def Default Value
	 */
	public addVariable(key: string, def: any = null) {
		if (this.variables.has(key)) return;

		this.variables.set(key, def);

		// findVariableValue and loadVariable
		this.processVariable(key);

		return this;
	}

	/**
	 * Remove Variable
	 * @param key Key
	 */
	public removeVariable(key: string)  {
		if (!this.variables.has(key)) return;

		this.unloadVariable(key);

		this.variables.delete(key);
	}

	/**
	 * Process Variable Key
	 * @param key Variable Key
	 */
	protected processVariable(key: string) {
		let value = this.findVariableValue(key);
		if (value == null) value = this.variables.get(key);

		return this.loadVariable(key, value);
	}

	/**
	 * Find Variable values from underlying enviroment
	 * This function will look on `process.env` and `window`
	 * @param key Key
	 */
	protected findVariableValue(key: string) {
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
	protected loadVariable(key: string, value: any) {
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
	protected unloadVariable(key: string) {
		// PluginAPI is unavilable. Unlikely that variable was loaded in the first place
		if (!this.api) return;

		this.api.bento.deleteVariable(key);
	}
}
