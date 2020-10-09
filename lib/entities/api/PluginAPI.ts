import { Bento } from '../../Bento';
import { Plugin } from '../interfaces';

import { SharedAPI } from './SharedAPI';

export class PluginAPI extends SharedAPI {
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
	public getBento() {
		return this.bento;
	}
}
