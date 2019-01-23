# Example bento-dependencies

This example teaches you about component dependencies in Bento.

In source you will find three (3) Components that depend on eachother in one
way or another.

Summary of dependencies in this example:
* `ComponentC` Depends on both `ComponentB` and `ComponentA`
* `ComponentB` Only depends on `ComponentA`
* `ComponentA` has no dependencies

Be sure to checkout ComponentB, it calls a method on ComponentA!

**Key Note** Make sure to note that the dependency arrays here are using raw uninstantiated references to the classes. This is a feature of bento and you can learn more in the `bento-references` example.
