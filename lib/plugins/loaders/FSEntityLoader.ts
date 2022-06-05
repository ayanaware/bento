// findEntity is the reason, ill try to tighten this down in the future
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { promises as fs } from 'fs';
import * as path from 'path';
import { pathToFileURL } from 'url';

import { IllegalStateError, ProcessingError } from '@ayanaware/errors';
import { Logger } from '@ayanaware/logger-api';

import { PluginAPI } from '../../entities/api/PluginAPI';
import { Entity, EntityType } from '../../entities/interfaces/Entity';
import { EntityLoadError } from '../../errors/EntityLoadError';
import { InstanceType } from '../../types/InstanceType';

import { EntityLoader } from './EntityLoader';

const log = Logger.get();

/**
 * We have to do this because TS automatically converts
 * import(file) to Promise.resolve().then(() => require(file))
 * which doesn't work with ESM.
 *
 * This can be removed once https://github.com/microsoft/TypeScript/issues/43329 is solved.
 */
// eslint-disable-next-line @typescript-eslint/no-implied-eval
const importDynamic = new Function('modulePath', 'return import(modulePath)');

/**
 * FSEntityLoader is a recursive entity loader for Bento.
 * Be sure to carefully read function documentation for potential gotchas
 */
export class FSEntityLoader extends EntityLoader {
	public name = 'FSEntityLoader';
	public api!: PluginAPI;

	public files: Set<string> = new Set();

	// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
	protected findEntity(item: any): Entity | InstanceType<Entity> {
		let object: Entity | InstanceType<Entity> = null;

		// import always seems to return an object
		// default is ESM default or CJS module.exports

		if (this.isEntitylike(item.default)) { // ES Module default export
			object = item.default as Entity | InstanceType<Entity>;
		} else { // ESModule named export, look for first Entitylike
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
			for (const obj of Object.values(item)) {
				if (this.isEntitylike(obj)) {
					if (object != null) {
						throw new ProcessingError('findEntity(): ESModule defines multiple exports and no default');
					}

					object = obj as Entity | InstanceType<Entity>;
				}
			}
		}

		return object;
	}

	protected async getFileList(directory: string, recursive: boolean = true, accululator: Array<string> = []): Promise<Array<string>> {
		const files = await fs.readdir(directory);

		for (let file of files) {
			// TODO: Add support for .fselignore/.bentoignore

			// ignore node_modules & .git
			if (/node_modules|\.git/i.exec(file)) continue;

			file = path.resolve(directory, file);

			const stat = await fs.stat(file);

			if (stat.isDirectory() && recursive) accululator = await this.getFileList(file, recursive, accululator);
			else if (stat.isFile()) accululator.push(file);
		}

		return accululator;
	}

	protected async checkFile(file: string): Promise<boolean> {
		if (!(/\.(js|mjs|cjs|ts)$/i.exec(file))) return false;
		if (/\.d\.ts$/i.exec(file)) return false;

		// .e.js and .e.ts are considerend entities
		if (/\.e\.(js|ts)$/i.exec(file)) return true;

		// Check file
		try {
			const content = await fs.readFile(file, { encoding: 'utf8' });

			// @fs-entity-ignore
			if (/@fs-entity-ignore/mi.exec(content)) return false;

			// @ayanaware/bento and @fs-entity
			if (/@ayanaware\/bento|@fs-entity/mi.exec(content)) return true;
		} catch (e) {
			log.warn(`checkFile(): Failed to read "${file}". ${e}`);
		}

		// Check .d.ts file
		try {
			const dts = file.replace(/\.(js|mjs|cjs)$/i, '.d.ts');

			const stat = await fs.stat(dts);
			if (stat.isFile()) {
				const content = await fs.readFile(dts, { encoding: 'utf8' });
				if (/@ayanaware\/bento/mi.exec(content)) return true;
			}
		} catch { /* NO-OP */ }

		return false;
	}

	/**
	 * Bulk Instantiate Files and add them to Bento
	 * @param files Path Array
	 * @param type EntityType
	 */
	public async addFiles(files: Array<string> | Array<Array<string>>, type: EntityType = EntityType.COMPONENT): Promise<void> {
		for (const file of files) await this.addFile(file, type);
	}

	/**
	 * Instantiate File and add it to Bento
	 * @param file Path
	 * @param type EntityType
	 */
	public async addFile(file: string | Array<string>, type: EntityType = EntityType.COMPONENT): Promise<void> {
		if (Array.isArray(file)) file = path.resolve(...file);
		if (this.files.has(file)) throw new IllegalStateError(`addFile(): File "${file}" has already been added`);

		let nodeModule: unknown;
		try {
			nodeModule = await importDynamic(pathToFileURL(file));
		} catch (e) {
			throw new EntityLoadError(file, `addFile(): Failed to require "${file}"`).setCause(e as Error);
		}

		// Get the first index of the imported object:
		const entity = this.findEntity(nodeModule);
		if (!entity) {
			log.warn(`addFile(): Could not find entity in "${file}"`);
			return;
		}

		await this.addEntity(entity, type);
		this.files.add(file);
	}

	/**
	 * Bulk addDirectory(), please see that function documentation for more details
	 * @param directories Array of Directory Paths
	 * @param type EntityType
	 * @param recursive recursive?
	 */
	public async addDirectories(directories: Array<string | Array<string>>, type = EntityType.COMPONENT, recursive = true): Promise<void> {
		for (const directory of directories) await this.addDirectory(directory, type, recursive);
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
	public async addDirectory(directory: string | Array<string>, type = EntityType.COMPONENT, recursive = true): Promise<void> {
		if (Array.isArray(directory)) directory = path.resolve(...directory);

		const files = await this.getFileList(directory, recursive);
		for (const file of files) {
			if (!(await this.checkFile(file))) continue;

			await this.addFile(file, type);
		}
	}
}
