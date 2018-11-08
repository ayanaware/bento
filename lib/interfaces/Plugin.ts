'use strict';

import { Bento } from "../Bento";

export interface Plugin {
	bento?: Bento;

	name: string;
	version?: string;

	onLoad?(): Promise<void>;
	onUnload?(): Promise<void>;
}
