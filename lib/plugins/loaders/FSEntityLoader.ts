import { promises as fs } from 'fs';
import * as path from 'path';

import { IllegalStateError, ProcessingError } from '@ayanaware/errors';

import { EntityLoadError } from '../../errors';
import { EntityType, PluginAPI } from '../../entities';
import { EntityLoader } from './EntityLoader';

import { Logger } from '@ayanaware/logger-api';
const log = Logger.get();

/**
 * FSEntityLoader is a recursive entity loader for Bento.
 * Be sure to carefully read function documentation for potential gotchas
 */
export class FSEntityLoader extends EntityLoader {
	public name = 'FSEntityLoader';
	public api!: PluginAPI;

	public files: Set<string> = new Set();

	protected findEntity(item: any) {
		let object = null;
		if (item.__esModule) {
			// ESModule
			if (this.isEntitylike(item.default)) object = item.default;
			else {
				for (const obj of Object.values(item)) {
					if (this.isEntitylike(obj)) {
						if (object != null) {
							throw new ProcessingError('findEntity(): ESModule defines multiple exports and no default');
						}

						object = obj;
					}
				}
			}
		} else {
			// CommonJS module.exports
			if (!this.isEntitylike(item)) object = item;
		}

		return object;
	}

	protected async getFileList(directory: string, recursive: Boolean = true, accululator: Array<string> = []) {
		const files = await fs.readdir(directory);

		for (let file of files) {
			// TODO: Add support for .fselignore/.bentoignore

			// ignore node_modules & .git
			if (file.match(/node_modules|\.git/i)) continue;

			file = path.resolve(directory, file);

			const stat = await fs.stat(file);

			if (stat.isDirectory() && recursive) accululator = await this.getFileList(file, recursive, accululator);
			else if (stat.isFile()) accululator.push(file);
		}

		return accululator;
	}

	protected async checkFile(file: string): Promise<Boolean> {
		if (!file.match(/\.(js|ts)$/i)) return false;
		if (file.match(/\.d\.ts$/i)) return false;

		// .e.js and .e.ts are considerend entities
		if (file.match(/\.e\.(js|ts)$/i)) return true;

		// Check file
		try {
			const content = await fs.readFile(file, { encoding: 'utf8' });
			
			// @fs-entity-ignore
			if (content.match(/@fs-entity-ignore/mi)) return false;

			// @ayanaware/bento and @fs-entity
			if (content.match(/@ayanaware\/bento|@fs-entity/mi)) return true;
		} catch (e) {
			log.warn(`checkFile(): Failed to read "${file}". ${e}`);
		}

		// Check .d.ts file
		try {
			const dts = file.replace(/\.js$/i, '.d.ts');

			const stat = await fs.stat(dts);
			if (stat.isFile()) {
				const content = await fs.readFile(dts, { encoding: 'utf8' });
				if (content.match(/@ayanaware\/bento/mi)) return true;
			}
		} catch (e) {
			// NO OP
		}

		return false;
	}

	/**
	 * Bulk Instantiate Files and add them to Bento
	 * @param files Path Array
	 * @param type EntityType
	 */
	public async addFiles(files: Array<string> | Array<Array<string>>, type: EntityType = EntityType.COMPONENT) {
		for (const file of files) await this.addFile(file, type);
	}

	/**
	 * Instantiate File and add it to Bento
	 * @param file Path
	 * @param type EntityType
	 */
	public async addFile(file: string | Array<string>, type: EntityType = EntityType.COMPONENT) {
		if (Array.isArray(file)) file = path.resolve(...file);
		if (this.files.has(file)) throw new IllegalStateError(`addFile(): File "${file}" has already been added`);

		let nodeModule: any;
		try {
			nodeModule = require(file);
		} catch (e) {
			throw new EntityLoadError(file, `addFile(): Failed to require "${file}"`).setCause(e);
		}

		const entity = this.findEntity(nodeModule);
		await this.addEntity(entity, type);

		this.files.add(file);
	}

	/**
	 * Find Entity Files in a directory and add them to Bento
	 * 
	 * A file will be eligiable for loading in the following circumstances:
	 * 
	 * - Extension ends with `.e.ts` or `.e.js`
	 * - File contents include `@fs-entity`
	 * - File contents include `@ayanaware/bento`
	 * - Associated types file `.d.ts` contents include `@ayanaware/bento`
	 * 
	 * If none of these conditions are met then the file will be skipped.
	 *
	 * **If all else fails, add the comment `// @fs-entity` and it will be loaded**
	 * 
	 * **To prevent loading add the comment `// @fs-entity-ignore`**
	 * 
	 * @param directory Directory Path
	 * @param type EntityType
	 * @param recursive recursive?
	 */
	public async addDirectory(directory: string | Array<string>, type: EntityType = EntityType.COMPONENT, recursive: boolean = true) {
		if (Array.isArray(directory)) directory = path.resolve(...directory);

		const files = await this.getFileList(directory, recursive);
		for (const file of files) {
			if (!(await this.checkFile(file))) continue;

			try {
				await this.addFile(file, type);
			} catch (e) {
				log.warn(`addDirectory(): Failed to addFile "${file}". ${e}`);
				continue;
			}
		}
	}
}
