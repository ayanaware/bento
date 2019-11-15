
import * as Eris from 'eris';

import {
	ComponentAPI,
	SubscribeEvent,
	Variable,
	VariableDefinitionType,
} from '@ayanaware/bento';

import { Config } from '../Config';
import { DiscordEvent } from '../Constants';

import { Logger } from '@ayana/logger';
const log = Logger.get('Discord');

export class Discord {
	public api: ComponentAPI;
	public name: string = 'Discord';

	private cli: Eris.Client = null;

	@Variable({ type: VariableDefinitionType.STRING, name: Config.BOT_TOKEN, default: null }) // Can be done via this.api.getVariable(definition) for non ts users
	private token: string = null;

	public async onLoad() {
		if (this.token == null) throw new Error(`Please set the BOT_TOKEN env variable to your token (ex: BOT_TOKEN='xxx' node build/bento-discord-eris)`);

		log.info(`Initilizing Discord`);
		// create our eris client
		this.cli = new Eris.Client(this.token, {
			autoreconnect: true,
			firstShardID: 0,
			maxShards: 1,
		});

		// forward events we care about
		this.api.forwardEvents(this.cli, Object.values(DiscordEvent));

		// connect to dicksword
		await this.cli.connect();
	}

	public async onUnload() {
		// cleanup
		this.cli.disconnect({ reconnect: false });
		this.cli.removeAllListeners();

		this.cli = null;
	}

	@SubscribeEvent(Discord, DiscordEvent.SHARD_READY)
	private handleReady(id: number) {
		log.info(`Shard ${id} Ready!`);
	}

	@SubscribeEvent(Discord, DiscordEvent.SHARD_RESUME)
	private handleResume(id: number) {
		log.info(`Shard ${id} Resumed!`);
	}

	@SubscribeEvent(Discord, DiscordEvent.SHARD_DISCONNECT)
	private handleDisconnect(id: number) {
		log.info(`Shard ${id} Disconnected!`);
	}
}
