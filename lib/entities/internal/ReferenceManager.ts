import { IllegalStateError } from '@ayanaware/errors';

/**
 * ReferenceManager associates constructors with a id
 */
export class ReferenceManager<T extends { name: string }> {
	private readonly references: Map<any, string> = new Map();
	private readonly rewrites: Map<string, string> = new Map();

	/**
	 * Resolves the name of the given entity.
	 * If the given entity is already a string, the same string will be returned.
	 *
	 * @param reference Reference
	 * @param error Throw Error on resolve failure
	 *
	 * @returns Entity Name or null
	 */
	public resolve(reference: string | Function | T, error: boolean = false): string {
		let name;
		if (typeof reference === 'string') name = reference;
		else if (typeof reference === 'function' && this.references.has(reference)) name = this.references.get(reference);
		else if (typeof reference === 'object' && Object.prototype.hasOwnProperty.call(reference, 'name')) name = reference.name;
		else return null;

		// Rewrites
		while (this.rewrites.has(name) && name !== this.rewrites.get(name))
			name = this.rewrites.get(name);

		if (!name && error) throw new IllegalStateError('Reference is not registered, or does not have a name');

		return name;
	}

	/**
	 * Registers an entity in a reference map so the type can be used instead of the entity name.
	 * This only works if the entity has a constructor function.
	 *
	 * @param entity The entity to be registered
	 */
	public add(entity: Function | T, name?: string) {
		if (entity.constructor != null && entity.constructor !== Object) {
			this.references.set(entity.constructor, name || entity.name);
		}
	}

	/**
	 * Removes an entity from the reference map.
	 * This only works if the entity has a constructor function.
	 *
	 * @param entity The entity to be removed
	 */
	public remove(entity: Function | T) {
		const name = this.references.get(entity.constructor);
		this.references.delete(entity.constructor);

		if (this.rewrites.has(name)) this.rewrites.delete(name);
		// TODO: Walk rewrites, to prevent a multi rewrite from staying
	}

	public addRewrite(entity: string | Function | T, rewrite: string) {
		const name = this.resolve(entity);
		if (!name) return false;

		this.rewrites.set(name, rewrite);

		// TODO: Proactivly update old rewrites, ie hello => world, world => new. We should go back and update hello => new

		return true;
	}

	public removeRewrite(entity: string | Function | T) {
		const name = this.resolve(entity);
		if (!name) return false;

		this.rewrites.delete(name);
		return true;
	}
}
