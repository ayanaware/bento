
import { GlobalInstanceOf } from '@ayanaware/errors';

import { Plugin } from '../plugins';

import { PluginError } from './PluginError';

@GlobalInstanceOf('@ayanaware/bento', '1')
export class PluginRegistrationError extends PluginError {
	public readonly plugin: Plugin;

	public constructor(plugin: Plugin, msg: string) {
		super(msg);

		this.__define('plugin', plugin);
	}
}
