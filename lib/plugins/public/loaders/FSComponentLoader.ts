
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';

import { IllegalArgumentError, IllegalStateError } from '@ayanaware/errors';

import { Component } from '../../../entities';
import { EntityLoadError } from '../../../errors';

import { ComponentLoader } from './ComponentLoader';

/**
 * @ignore
 */
const readdir = util.promisify(fs.readdir);

/**
 * @ignore
 */
const stat = util.promisify(fs.stat);

interface DirectoryItem {
	type: 'DIRECTORY' | 'FILE' | null;
	name: string;
	path: string;
	parent: string;
}

export class FSComponentLoader extends ComponentLoader {
	public name: string = 'FSComponentLoader';

	// list of currently loaded directories and components
	private readonly directories: Set<string> = new Set();
	private readonly components: Set<string> = new Set();

	// handles if addDirectory was called before bento has been attached
	private pending: Array<{ file: string, instance: Component }> = [];

	public async onLoad() {
		// handle any pending components
		if (this.pending.length > 0) {
			for (const { file, instance } of this.pending) {
				try {
					const name = await this.api.getBento().addComponent(instance);
					this.components.add(name);
				} catch (e) {
					throw new EntityLoadError(file, `Failed to attach component "${file}"`).setCause(e);
				}
			}

			// reset array
			this.pending = [];
		}
	}

	/**
	 * Add multiple directories at once
	 * @param directories Array of paths
	 */
	public async addDirectories(directories: Array<string>) {
		for (const directory of directories) await this.addDirectory(directory);
	}

	/**
	 * Add and load all component like files and directories in given directory
	 * @param directory Directory path
	 */
	public async addDirectory(...directory: Array<string>) {
		const absolute = path.resolve(...directory);
		if (this.directories.has(absolute)) throw new IllegalStateError(`Directory "${absolute}" already loaded`);

		const components: Array<string> = [];

		// find component files
		const files = await this.findComponentFiles(absolute);
		for (const file of files) {
			// create component instance
			const instance = await this.createInstance(file);
			// skip empty instances
			if (instance == null) continue;

			// gracefully handle bento not being attached yet
			if (this.api != null) {
				try {
					const name = await this.api.getBento().addComponent(instance);
					this.components.add(name);
				} catch (e) {
					throw new EntityLoadError(file, `Failed to attach component "${file}"`).setCause(e);
				}
			} else this.pending.push({ file, instance });
		}

		this.directories.add(absolute);
	}

	public async removeDirectory(...directory: Array<string>) {
		const absolute = path.resolve(...directory);

		// TODO: Implement later
	}

	/**
	 * Should only ever be called by internally by bento
	 * @param directory Path to directory
	 *
	 * @returns Promise
	 */
	public async loadComponents(...directory: Array<string>) {
		return this.addDirectory(...directory);
	}

	private async createInstance(component: string) {
		let nodeModule: any;
		try {
			nodeModule = require(component);
		} catch (e) {
			throw new EntityLoadError(component, `Failed to require module "${component}"`).setCause(e);
		}

		try {
			const comp = this.findComponent(nodeModule);

			return this.instantiate(comp);
		} catch (e) {
			throw new EntityLoadError(component, `Failed to create component instance "${component}"`).setCause(e);
		}
	}

	/**
	 * Attempts to resolve a directory to a component file
	 * @param directory - directory path
	 *
	 * @returns List of component file paths
	 */
	private async findComponentFiles(directory: string): Promise<Array<string>> {
		const paths: Array<string> = [];

		// get component directory contents
		const contents = await this.fetchDirectoryContents(directory);

		// maybe add .bentoignore feature

		// seperate types
		const { files, directories } = contents.reduce((a, c) => {
			if (c.type === 'DIRECTORY') a.directories.push(c);
			else if (c.path.endsWith('.js') && c.path) a.files.push(c);

			return a;
		}, { files: [], directories: [] });

		// concat files
		// excluding top-level index.js
		files.filter(c => c.name !== 'index.js').forEach(c => paths.push(c.path));

		const promises: Array<Promise<string>> = directories.map((i: DirectoryItem) => this.findDirectoryComponent(i.path));

		const resolved = await Promise.all(promises);
		resolved.filter(p => p != null).forEach(p => paths.push(p));

		return paths;
	}

	private async findDirectoryComponent(directory: string) {
		if (typeof directory !== 'string' || directory === '') throw new IllegalArgumentError('Directory must be a string');
		directory = path.resolve(directory);

		let items = await this.fetchDirectoryContents(directory);
		items = items.filter(i => i.type === 'FILE' && i.path.endsWith('.js'));

		// use index.js if it exists
		const index = items.find(i => i.name === 'index.js');
		if (index != null) return index.path;

		// single js file
		if (items.length === 1) return items[0].path;

		return null;
	}

	private async fetchDirectoryContents(directory: string): Promise<Array<DirectoryItem>> {
		if (typeof directory !== 'string' || directory === '') throw new IllegalArgumentError('Directory must be a string');
		directory = path.resolve(directory);

		const contents: Array<DirectoryItem> = [];

		const items = await readdir(directory);
		const promises: Array<Promise<fs.Stats>> = items.reduce((a, item) => {
			const absolute = path.resolve(directory, item);

			// add entry to contents
			contents.push({
				type: null,
				name: item,
				path: absolute,
				parent: directory,
			});

			// push promise to be resolved
			a.push(stat(absolute));

			return a;
		}, []);

		const stats: Array<fs.Stats> = await Promise.all(promises);
		for (let i = 0; i < stats.length; i++) {
			contents[i].type = stats[i].isDirectory() ? 'DIRECTORY' : 'FILE';
		}

		return contents;
	}
}
