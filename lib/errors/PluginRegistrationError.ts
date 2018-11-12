'use strict';

import { GlobalInstanceOf } from '@ayana/errors';

import { Plugin } from '../interfaces';

import { PluginError } from './PluginError';

@GlobalInstanceOf('@ayana/components', '1')
export class PluginRegistrationError extends PluginError {
	public readonly plugin: Plugin;

	constructor(plugin: Plugin, msg: string) {
		super(msg);

		this.define('plugin', plugin);
	}
}