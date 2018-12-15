'use strict';

import { Bento } from '../Bento';

export interface Plugin {
	bento?: Bento;

	/**
	 * The name of this plugin
	 */
	name: string;
	version?: string;

	onLoad?(bento?: Bento): Promise<void>;
	onUnload?(): Promise<void>;
}
