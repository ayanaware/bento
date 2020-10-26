# Example bento-decorators

Bento Decorators are available for Typescript projects. They are helpers to help you write less code for common tasks in Bento.

For decorators to work you must have `compilerOptions.experimentalDecorators` set to true in your `tsconfig.json` file.
This enables Typescript's Implementation of Decorators. More details available [here](https://www.typescriptlang.org/docs/handbook/decorators.html)

The `@Inject` decorator can be further improved by adding `reflect-metadata` to your project. And setting `compilerOptions.emitDecoratorMetadata` to true in your `tsconfig.json` file.
This allows Inject to infer the Entity to inject using the property type. This means you can type `@Inject() private example: Example;` instead of `@Inject(Example) private example: Example;`