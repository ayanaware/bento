'use strict';

import { IllegalArgumentError } from '@ayana/errors';

/**
 * ReferenceManager associates constructors with a id
 */
export class ReferenceManager<T extends { name: string }> {
	private readonly references: Map<any, string> = new Map();

	/**
	 * Registers an entity in a reference map so the type can be used instead of the entity name.
	 * This only works if the entity has a constructor function.
	 *
	 * @param entity The entity to be registered
	 */
	public addReference(entity: T) {
		// TODO Use Symbols.runtimeIdentifier so when a entity is reloaded old references won't break
		if (entity.constructor != null && entity.constructor !== Object) {
			this.references.set(entity.constructor, entity.name);
		}
	}

	/**
	 * Removes an entity from the reference map.
	 * This only works if the entity has a constructor function.
	 *
	 * @param entity The entity to be removed
	 */
	public removeReference(entity: T) {
		// TODO Use Symbols.runtimeIdentifier so when a entity is reloaded old references won't break
		this.references.delete(entity.constructor);
	}

	/**
	 * Resolves the name of the given entity.
	 * If the given entity is already a string, the same string will be returned.
	 * If the component cannot be found this method throws an error
	 *
	 * @param reference Entity instance, name or reference
	 *
	 * @returns The entitys name
	 */
	public resolveName(reference: T | string | Function): string {
		const name = this.resolveNameSafe(reference);

		if (name == null) throw new IllegalArgumentError('Given entity or reference is invalid, not registered or does not have a name');

		return name;
	}

	/**
	 * Resolves the name of the given entity.
	 * If the given entity is already a string, the same string will be returned.
	 * If the component cannot be resolved this method returns null.
	 *
	 * @param reference Entity instance, name or reference
	 *
	 * @returns The entitys name
	 */
	public resolveNameSafe(reference: T | string | Function): string {
		let name: string = null;
		if (typeof reference === 'string') name = reference;
		else if (reference != null) {
			// Check if we have the constructor
			if (this.references.has(reference)) name = this.references.get(reference);

			// Check if property "name" exists on the object
			else if (Object.prototype.hasOwnProperty.call(reference, 'name')) name = reference.name;
		}

		return name;
	}
}
