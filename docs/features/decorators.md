# Bento Decorators

For Typescript users Bento provides many helpful decorators to make life even easier. While decorators are currently typescript only it should be noted everything possible with decorators is possible in vanilla NodeJS.

### @Variable

The @variable decorator is used to quickly bind Bento variables to your component.

Example:
```ts
import { ComponentAPI, Variable } from '@ayanaware/bento';

class VariableComponent {
	public api: ComponentAPI;
	public name: string = 'VariableComponent';

	@Variable({ type: 'string', name: 'foo' })
	private bar: string;
}
```

In the above example Bento will bind the bento variable `foo` to the component property `bar`. Additionally because there was no default defined in the @Variable declaration if the Bento variable `foo` does not exist an error will be thrown during the registration of this component.

### @Subscribe

*TODO*
