# Bento [![npm (scoped)](https://img.shields.io/npm/v/@ayana/bento.svg)](https://www.npmjs.com/package/@ayana/bento) [![Discord](https://discordapp.com/api/guilds/508903834853310474/embed.png)](https://discord.gg/eaa5pYf) [![install size](https://packagephobia.now.sh/badge?p=@ayana/bento)](https://packagephobia.now.sh/result?p=@ayana/bento)

[Documentation](https://docs.ayana.io/modules/bento.html)

Bento is a robust NodeJS application framework designed to make creating and maintaing complex projects a simple and fast process.

### What does Bento do:
* Robust plugable application framework.
* Featuring: Components, Events, Plugins, Properties, Variables
* Component lifecycle state and management
* Consistent Component API
* Defines strict, opinionated, rules

### What is a Bento Component?
Bento indroduces a concept of components. Components are logical chunks of code that all work together to provide your application to the world.

Components should not take on more then required. (IE: instead of having one component for connecting to Discord and processing messages. Have two, one for the connection and one that handles messages)

### How to use Bento (IN-PROGRESS)
Using bento is pretty simple. First import and initilize bento and any plugins you wish to use. Then simply add plugins to bento

```ts
'use strict';

import { Bento, FSComponentLoader } from '@ayana/bento';

// Create a Bento instance
const bento = new Bento();

// Anonymous async function so we can use await
(async () => {
	// Create FSComponentLoader
	// NOTE: Keep in mind all FSComponentLoader does is find components in a path
	// Instantiates them and calls bento.addComponent
	// Behind the scenes
	const fsloader = new FSComponentLoader();
	await fsloader.addDirectory(__dirname, 'components');

	// Apply plugin to Bento.
	await bento.addPlugin(fsloader);

	// Verify that Application looks good to continue
	await bento.verify();
})().catch(e => {
	console.error(`Error while starting bento:\n${e}`);
	process.exit(1);
});
```