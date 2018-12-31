'use strict';

import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';

import { IllegalStateError } from '@ayana/errors';

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
	path: string;
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
	}

	public async removeDirectory(...directory: string[]) {
		const absolute = path.resolve(...directory);
	}

	/**
	 * Attempts to resolve a DirectoryItem to a component file
	 * @param item - DirectoryItem
	 */
	private async findComponentFiles(items: Array<DirectoryItem>): Promise<Array<string>> {
		const paths: Array<string> = [];

		// seperate types
		const { files, directories } = items.reduce((a, c) => {
			if (c.type === 'DIRECTORY') a.directories.push(c);
			else {
				// verify file ends in .js
				if (c.path.endsWith('.js')) a.files.push(c);
			}

			return a;
		}, { files: [], directories: [] });

		// concat files
		paths.concat(files.map(c => c.path));

		const promises: Array<Promise<string>> = directories.reduce((a, c) => {
			a.push(new Promise(resolve => {
				// soon
				resolve();
			}));

			return a;
		}, []);

		(await Promise.all(promises)).filter(v => v !== null).forEach(v => paths.push(v));

		return paths;
	}

	private async fetchDirectoryContents(directory: string): Promise<Array<DirectoryItem>> {
		const contents: Array<DirectoryItem> = [];

		const items = await readdir(directory);
		const promises: Array<Promise<fs.Stats>> = items.reduce((a, item) => {
			const absolute = path.resolve(directory, item);

			// add entry to contents
			contents.push({ type: null, path: absolute });

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
