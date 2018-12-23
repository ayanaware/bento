'use strict';

import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';

import { Bento } from '../Bento';
import { Component } from '../interfaces';

/**
 * @ignore
 */
const readdir = util.promisify(fs.readdir);

/**
 * @ignore
 */
const stat = util.promisify(fs.stat);

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
}
