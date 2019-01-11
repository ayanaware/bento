'use strict';

import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';

import { IllegalArgumentError } from '@ayana/errors';

import { Bento } from '../../Bento';
import { Component } from '../../interfaces';

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

export class FSPlugin {
	public bento: Bento;

	private components: Map<string, string[]>;

	public async addDirectory(...directory: string[]) {
		const absolute = path.resolve(...directory);

		// find all files and directories in "absolute"
		// determine component files and directories
		// instantiate components
		// add components to bento
		const files = await this.findComponentFiles(absolute);
		console.log(absolute);
		console.log(files);
	}

	public async removeDirectory(...directory: string[]) {
		const absolute = path.resolve(...directory);
	}

	/**
	 * Attempts to resolve a DirectoryItem to a component file
	 * @param item - DirectoryItem
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
			contents[i].type = stats[i].isDirectory() === true ? 'DIRECTORY' : 'FILE';
		}

		return contents;
	}
}
