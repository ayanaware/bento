
import { IllegalArgumentError, IllegalStateError } from '@ayana/errors';

import { SharedAPI } from '../abstractions';
import { Bento } from '../Bento';

import { Plugin } from './interfaces';

export class PluginAPI extends SharedAPI {
	/**
	 * The plugin this API object belongs to
	 */
	private readonly plugin: Plugin;

	public constructor(bento: Bento, plugin: Plugin) {
		super(bento);

		this.plugin = plugin;
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
