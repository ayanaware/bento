'use strict';

import * as crypto from 'crypto';
import { EventEmitter } from 'events';

import { ComponentAPI } from './ComponentAPI';

import {
	PrimaryComponent,
	SecondaryComponent,
} from '../abstractions';

export interface ComponentManagerOptions {}

export class ComponentManager extends EventEmitter {
	public readonly primary: Map<string, PrimaryComponent>;
	public readonly secondary: Map<string, SecondaryComponent>;

	private readonly pending: Map<string, PrimaryComponent>;

	public readonly events: Map<string, EventEmitter>;

	public readonly opts: ComponentManagerOptions;

	constructor(opts: ComponentManagerOptions) {
		super();

		this.primary = new Map();
		this.secondary = new Map();

		this.pending = new Map();

		this.events = new Map();

		this.opts = opts;
	}

	public createID(len: number = 16) {
		return crypto.randomBytes(len)
		.toString('base64')
		.replace(/[^a-z0-9]/gi, '')
		.slice(0, len);
	}

	public async addPrimaryComponent(component: PrimaryComponent): Promise<string> {
		if (!component.name) throw new Error(`Primary Components must specify a name!`);
		if (this.primary.has(component.name)) throw new Error(`Primary Component names must be unique!`);

		if (!component.dependencies || component.dependencies.length === 0) {
			// zero dependency primary component, insta-load
			const success = await this.loadPrimaryComponent(component);
			
			// if any pending components attempt to handle them now
			if (success && this.pending.size > 0) await this.handlePendingComponents();
		} else {
			// determine dependencies
			const missing = this.getMissingDependencies(component);	
			if (missing.length === 0) {
				// All dependencies are already loaded
				const success = await this.loadPrimaryComponent(component);

				// if any pending components attempt to handle them now
				if (success && this.pending.size > 0) await this.handlePendingComponents();
			} else {
				// not able to load this component yet :c
				this.pending.set(component.name, component);
			}
		}

		return component.name;
	}

	public async removePrimaryComponent(name: string) {
		const component = this.primary.get(name);
		if (!component) throw new Error(`Primary Component '${name}' is not currently loaded.`);

		// TODO: check if required, required components can't be unloaded

		// call unMount
		if (component.onUnload) {
			try {
				await component.onUnload();
			} catch (e) {
				// force unload
			}
		}
	}

	private async loadPrimaryComponent(component: PrimaryComponent) {
		// primary component name
		Object.defineProperty(component, 'name', {
			configurable: true,
			writable: false,
			enumerable: true,
			value: component.name,
		});

		// define releveant primary properties
		Object.defineProperty(component, 'dependencies', {
			configurable: true,
			writable: false,
			enumerable: true,
			value: component.dependencies,
		});

		Object.defineProperty(component, 'required', {
			configurable: true,
			writable: false,
			enumerable: true,
			value: component.required,
		});

		// define __primary
		Object.defineProperty(component, '__primary', {
			configurable: false,
			writable: false,
			enumerable: false,
			value: true,
		});

		// create components' api
		const api = new ComponentAPI(component.name, this);

		// define api
		Object.defineProperty(component, 'api', {
			configurable: false,
			writable: false,
			enumerable: true,
			value: api,
		})

		// call onLoad
		if (component.onLoad) {
			try {
				await component.onLoad();
			} catch (e) {
				if (component.required) throw new Error(`Primary Component '${component.name}'. Has stated it is required. Exiting...`);
				return false;
			}
		}

		this.primary.set(component.name, component);

		// create primary componet event emitter if it doesn't already exist
		if (!this.events.has(component.name)) {
			// create new eventEmitter
			const emitter = new EventEmitter();
			this.events.set(component.name, emitter);
		}

		return true;
	}

	private getMissingDependencies(component: PrimaryComponent): string[] {
		if (!component.dependencies) return [];

		return component.dependencies.reduce((a, depend) => {
			if (!this.primary.has(depend)) a.push(depend);

			return a;
		}, []);
	}

	private async handlePendingComponents(): Promise<void> {
		let loaded = 0;

		// TODO: replace with asyncAwaitForEach
		Array.from(this.pending.entries()).forEach(async ([name, component]) => {
			const missing = await this.getMissingDependencies(component);
			if (missing.length === 0) {
				// whatever happens remove from pending...
				if (this.pending.has(component.name)) this.pending.delete(component.name);

				const success = await this.loadPrimaryComponent(component);
				if (success) loaded++;
			}
		});

		// TODO: uncomment
		// if (loaded > 0) await this.handlePendingComponents();
	}

	public async addSecondaryComponent(component: SecondaryComponent) {

	}

	public async removeSecondaryComponent(id: string) {
		const component = this.secondary.get(id);
		if (!component) throw new Error(`Component '${id}' is not currently loaded.`);

		// call unMount
		if (component.onUnload) {
			try {
				await component.onUnload();
			} catch (e) {
				// force unload
			}
		}
	}

	private async loadSecondaryComponent(component: SecondaryComponent) {
		// generate uniqueID (name)
		const name = this.createID();

		// apply it to component
		Object.defineProperty(component, 'name', {
			configurable: true,
			writable: false,
			enumerable: true,
			value: name,
		});

		const api = new ComponentAPI(name, this);

		// define api
		Object.defineProperty(component, 'api', {
			configurable: false,
			writable: false,
			enumerable: true,
			value: api,
		})

		// call onMount
		if (component.onLoad) {
			try {
				await component.onLoad();
			} catch (e) {
				return false;
			}
		}

		this.secondary.set(name, component);
		return true;
	}
}

export interface ComponentManager {
	on(event: 'error', listener: (error: Error) => void): this;
}