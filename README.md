# @ayanaware/bento [![npm (scoped)](https://img.shields.io/npm/v/@ayanaware/bento.svg)](https://www.npmjs.com/package/@ayanaware/bento) [![Discord](https://discordapp.com/api/guilds/508903834853310474/embed.png)](https://discord.gg/eaa5pYf) [![install size](https://packagephobia.now.sh/badge?p=@ayanaware/bento)](https://packagephobia.now.sh/result?p=@ayanaware/bento)

[Documentation](https://docs.ayana.io/modules/bento.html) • [Examples](https://gitlab.com/ayanaware/bento/tree/master/examples)

Bento is an application framework designed to help with creating and maintaing modular projects.

## The Goal
Assist developers with common patterns used in modular codebases. While staying out
of their way, minimal headaches, minimal debt.

## The Promises
* Readability First: Bento's Code should be well documented and easy to read.
* Limited Dependencies: Solve problems by writing code, Not adding dependencies.
* Tests all the things: Catch some bugs before they get out.

## Stuff Bento does
* Plugable application framework.
* Featuring: Components, Events, Plugins, Properties, Variables
* Component and Plugin lifecycle management
* Consistent Component API
* Defines strict, opinionated, rules

## Stuff Bento does not do
* Bento *should* work in the browser, but it is not a website framework.

## Install
```bash
yarn add @ayanaware/bento
```

```bash
npm i @ayanaware/bento
```

## What is a Bento Component?
Bento indroduces a concept of components. Components are logical chunks of code that all work together to provide your application to the world.

All components recieve their own ComponentAPI instance. The Component API is consistent across all components and provides a way for components to speak to eachother. As well as many other "Quality of life" features. Such as: Dependency resolution and injection, Variable injection, component events, and more!

As a rule of thumb, components should not take on more then required. (IE: instead of having one component for connecting to Discord and processing messages. Have two, one for the connection and emitting the message events, and one that handles messages)

Here is a very basic example of a Bento component:
```ts
import { Component, ComponentAPI } from '@ayanaware/bento';

export class Basic implements Component {
	// required for all components, must be unique
	public name = 'Basic';
	// this property becomes available after onLoad see ComponentAPI for more info
	public api!: ComponentAPI;

	// Optionally define other components we depend upon
	// Some decorators auto append to this array such as @Subscribe
	public dependencies: Array<Component> = [];

	// Lifecycle event, called right before component fully loaded
	public async onLoad() {
		console.log('Hello world!');
	}

	// Lifecycle event, called right before component is unloaded
	public async onUnload() {
		console.log('Goodbye world!');
	}
}
```
A runnable version of this example is available on [Gitlab](https://gitlab.com/ayanaware/bento/tree/master/examples/src/bento-basic)

## How to use Bento
Getting started with Bento is pretty simple. First import and initilize Bento and any plugins you wish to use. Then simply add the plugins to Bento. The below example assumes you have a directory called "components" in the same directory (relative) to it.

```ts
import { Bento, EntityType, FSEntityLoader } from '@ayanaware/bento';

// Create a Bento instance
const bento = new Bento();

// Anonymous async function so we can use await
(async () => {
	// Create FSEntityLoader
	// NOTE: Keep in mind all FSEntityLoader does is
	// find components in a path, instantiates them and
	// calls Bento.addComponent() behind the scenes
	const fsel = new FSEntityLoader();
	await fsel.addDirectory([__dirname, 'components'], EntityType.COMPONENT);

	// Apply plugin to Bento.
	await bento.addPlugin(fsloader);

	// Verify that Application looks good to continue
	await bento.verify();
})().catch(e => {
	console.error(`Error while starting Bento:\n${e}`);
	process.exit(1);
});
```

## Bento Application
Application makes it even easier to bootstrap Bento Applications. Behind the scenes
FSEntityLoader is used to find plugins and components in `./plugins` and `./components` respectively.
Variables are also loaded using VariableFileLoader from `../env.example.json` and `../env.json`.
Finally bento instance and afformentioned plugins are completely exposed in cases when you need them.

```ts
import { Application } from '@ayanaware/bento';

// Bento Application Helper
const app = new Application();

// Anonymous async function so we can use await
(async () => {
	// Default Variables are loaded from `../env.example.json`
	// Variables are loaded from `../env.json`
	// Plugins in `./plugins` are instantiated and added to Bento
	// Components in `./components` are instantiated and added to Bento
	// All this behavior can be modifed using cfg in Application constructor
	await app.start();

	// Must be called, calls `bento.verify();` and returns `ApplicationState`
	await app.verify();
})().catch(e => {
	console.error(`Error while starting Application:\n${e}`);
	process.exit(1);
});
```

More examples available [here](https://gitlab.com/ayanaware/bento/tree/master/examples)

## Testimonials
Below are a few people raving about using Bento!

>So far Bento has been nothing but good memories in production, it does its job very very well,
 we've scaled to 40k Guilds, 10 shards a cluster and Bento makes life with scaling less scary.
 -- Plexi Development ([captchabot.xyz](https://captchabot.xyz/))