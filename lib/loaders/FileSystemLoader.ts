'use strict';

import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';

import { Loader } from './Loader';

const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);

interface DirectoryContent {
	file: string;
	path: string;
	stats: fs.Stats;
}

export class FileSystemLoader extends Loader {

	private async getDirectoryContents(directoryPath: string): Promise<DirectoryContent[]> {
		const results: DirectoryContent[] = [];

		const files = await readdir(directoryPath);

		const statPromises: Promise<fs.Stats>[] = [];
		for (const file of files) {
			const absolute = path.resolve(directoryPath, file);

			results.push({
				file,
				path: absolute,
				stats: null,
			});

			statPromises.push(stat(absolute));
		}

		const stats = await Promise.all(statPromises);
		for (let i = 0; i < stats.length; i++) {
			results[i].stats = stats[i];
		}

		return results;
	}

	private async getDirectoryComponent(directoryPath: string): Promise<string> {
		let contents = await this.getDirectoryContents(directoryPath);
		contents = contents.filter(c => c.stats.isFile() && c.path.endsWith('.js'));

		if (contents.length === 1) return contents[0].path;

		const index = contents.find(c => c.file === 'index.js');
		if (index != null) return index.path;

		return null;
	}

	private async getComponentFiles(root: string): Promise<string[]> {
		const contents = await this.getDirectoryContents(root);

		const components = contents.filter(c => c.file.endsWith('.js') && c.file !== 'index.js').map(c => c.path);

		const directories = contents.filter(c => c.stats.isDirectory());

		const dirCompPromises: Promise<string>[] = [];
		for (const dir of directories) {
			dirCompPromises.push(this.getDirectoryComponent(dir.path));
		}

		return components.concat(await Promise.all(dirCompPromises)).filter(v => v != null);
	}

}
