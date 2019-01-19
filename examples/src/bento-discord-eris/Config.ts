
import { ConfigBuilder, ConfigDefinitionType } from '@ayana/bento';

export enum Config {
	BOT_TOKEN = 'botToken',
}

export const Definitions = new ConfigBuilder()

// This definition defines a mapping for BOT_TOKEN env variable to be set to 'botToken' bento variable
.add(Config.BOT_TOKEN, {
	type: ConfigDefinitionType.STRING,
	env: 'BOT_TOKEN',
})

.build();
