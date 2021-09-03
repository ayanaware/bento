import type { Bento } from '../../Bento';
import { Plugin } from '../interfaces/Plugin';

import { EntityAPI } from './EntityAPI';

export class PluginAPI extends EntityAPI {
	// Make bento public as this is a plugin api
	public readonly bento: Bento;

	public constructor(bento: Bento, plugin: Plugin) {
		super(bento);

		this.entity = plugin;
	}

	/**
	 * Plugins are allowed to have direct access to bento
	 *
	 * @returns bento instance
	 */
	public getBento(): Bento {
		return this.bento;
	}
}
