# Example bento-references

This example teaches you about Bento references.

Bento references are a very useful feature that allow you to simply reference any component or plugin by its raw uninstantiated constructor.
This is extremly useful for avoiding static strings for dependencies and event subscriptions. The biggest advantage to using references
here is that if you ever need to change the name of a Component you don't have to also change everything referencing that name.

For example say you have a component `Component.ts` named `ComponentA` in bento. And for whatever reason you need to change this name to `ComponentB`.

### Here is an example of preforming this change with strings:
Component.ts
```ts
...
public api: ComponentAPI;
public name: string = 'ComponentB'; // Was just previously 'ComponentA'
...
```

Some other component that depended on ComponentA
```ts
...
public dependencies: string[] = ['ComponentB']; // We now have to update the dependency here

@Subscribe('ComponentB', ...) // We also have to change it here, etc...
private handleEvent()
...
```

## Now here is the same change with bento references:
Component.ts
```ts
...
public api: ComponentAPI;
public name: string = 'ComponentB'; // Was just previously 'ComponentA'
...
```

Some other component that depends on ComponentA
```ts
import { Component } from './ComponentA'; // Didn't change file name (but you could)
...
public dependencies: string[] = [Component]; // No reason to change unless you change class name

@Subscribe(Component, ...) // Also no need to change here
private handleEvent()
...
```

there are other reasons but this is one of the bigger ones. Also using references is just simplier then remember strings
as they work well with most IDEs

**Please note** It is only possible to use this feature on objects that contain a constructor (es6 classes) or have a `name` property on the object.
This is fine for most cases, but there are some edge cases that can cause problems.