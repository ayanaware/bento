# Example bento-ee3

Bento allows you to customize the eventEmitter library used behind the scenes. By default the native
`events.EventEmitter` is used. However if you need more performance, or maybe just prefer a different
one, then you can tell bento to use it at initilization.

Simply set the `eventEmitter` property in your Bento config to a function that returns a `EventEmitterLike`
aka anything that has `emit`, `addListener`, and `removeListener` functions. In this example we use eventemitter3

See `index.ts` in this example for how todo this
