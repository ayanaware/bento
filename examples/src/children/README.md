# Example bento-children

Bento allows you to create complex relationships and dependency trees between components.
One such mechanism is the parent, child architecture. This system allows you to take peer components and have a parent directly manages it's children.

A perfect use case for this is `Commands` Manager and a `Command` or a `HTTPServer` and a `Route`.
This architecture allows both the `Commands` Manager and the `Command` to share a common API instead of a "dumbed" downed subset of abstracted functions.

In this example we only show a basic use case of this parent, child architecture. For a more complete
example we recommended checking out the `bento-discord-eris` example. Specifically the `Commands` component.
