
import { Component, ComponentAPI } from '@ayana/bento';

import { Commands } from '../Commands';
import { Command, CommandExecute } from '../interfaces';

export class Ping implements Command {
	public api: ComponentAPI;
	public name: string = 'Ping';

	public parent: Component = Commands;

	public command: string = 'ping';

	public async execute({ channel }: CommandExecute) {
		await channel.createMessage('Pong!');
	}
}
