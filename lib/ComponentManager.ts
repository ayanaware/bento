'use strict';

import { EventEmitter } from 'events';

import {
	PrimaryComponent,
	SecondaryComponent
} from './abstractions';

export interface ComponentManagerOptions {}

export class ComponentManager extends EventEmitter {
	private readonly primary: Map<string, PrimaryComponent>;
	private readonly secondary: Map<string, SecondaryComponent>;

	private readonly pending: Map<string, PrimaryComponent>;

	public readonly opts: ComponentManagerOptions;

	constructor(opts: ComponentManagerOptions) {
		super();

		this.primary = new Map();
		this.secondary = new Map();

		this.pending = new Map();

		this.opts = opts;
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
				// TODO: load component
			}
		});

		// TODO: uncomment
		// if (loaded > 0) await this.handlePendingComponents();
	}

	public async addPrimaryComponent(component: PrimaryComponent): Promise<string> {
		if (!component.name) throw new Error(`Primary Components must specify a name!`);
		if (this.primary.has(component.name)) throw new Error(`Primary Component names must be unique!`);

		let loaded = 0;

		const loadComponent = async (component: PrimaryComponent) => {
			if (component.onMount) {
				try {
					await component.onMount();
					loaded++;
				} catch (e) {
					if (component.required) throw new Error(`Primary Component '${component.name}'. Has stated it is required. Exiting...`);
				}
			}

			if (this.pending.has(component.name)) this.pending.delete(component.name);
			this.primary.set(component.name, component);
		};

		if (!component.dependencies || component.dependencies.length === 0) {
			// zero dependency primary component, insta-load
			await loadComponent(component);
		} else {
			// determine dependencies
			const missing = this.getMissingDependencies(component);	
			if (missing.length === 0) {
				// All dependencies are already loaded
				await loadComponent(component);
			} else {
				// not able to load this component yet :c
				this.pending.set(component.name, component);
			}
		}

		if (this.pending.size > 0 && loaded > 0) await this.handlePendingComponents();

		return component.name;
	}

	public async removePrimaryComponent(name: string) {
		if (!this.primary.has(name)) throw new Error(`Primary Component '${name}' is not currently loaded.`);
	}
}

export interface ComponentManager {
	on(event: 'error', listener: (error: Error) => void): this;

	emit(event: 'error', error: Error);
}