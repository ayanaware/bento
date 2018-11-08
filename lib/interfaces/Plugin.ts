'use strict';

import { Bento } from '../Bento';

export interface Plugin {
	bento?: Bento;

	/**
	 * The name of this plugin
	 */
	name: string;
	version?: string;

	onLoad?(): Promise<void>;
	onUnload?(): Promise<void>;
}
