
import { AyanaError } from '@ayana/errors';

export class LiteEmitterError extends AyanaError {}

export type LiteEmitterHandler = (...args: Array<any>) => void;

/**
 * LiteEmitter is a very simplified implementation of a eventemitter.
 */
export class LiteEmitter {
	private readonly handlers: Map<string, Set<LiteEmitterHandler>> = new Map();

	/**
	 * Add a handler function for a given event
	 *
	 * @param name name of event
	 * @param fn handler function
	 */
	public addListener(name: string, fn: LiteEmitterHandler) {
		// create new set if required
		if (!this.handlers.has(name)) this.handlers.set(name, new Set());

		// add the new handler
		const handlers = this.handlers.get(name);
		handlers.add(fn);
	}

	/**
	 * Remove one or all handler functions for a given event
	 *
	 * @param name name of event
	 * @param fn optional handler to detach
	 */
	public removeListener(name: string, fn?: LiteEmitterHandler) {
		const handlers = this.handlers.get(name);
		if (!handlers) return;

		// a specfic fn was provided, try to find it
		if (fn && handlers.has(fn)) {
			handlers.delete(fn);

			// if no handlers left, delete the set
			if (handlers.size === 0) this.handlers.delete(name);
		} else {
			// delete all handlers
			this.handlers.delete(name);
		}
	}

	/**
	 * Emit a new event to handlers
	 *
	 * @param name name of event
	 * @param args event arguments
	 */
	public emit(name: string, ...args: Array<any>) {
		const handlers = this.handlers.get(name);
		if (!handlers) return;

		for (const handler of handlers) {
			try {
				handler(...args);
			}	catch (e) {
				if (name === 'error') throw new LiteEmitterError(`Caught Error in "error" handler function`).setCause(e);

				// emit as an error
				this.emit('error', new LiteEmitterError(`Caught Error in handler function`).setCause(e));
			}
		}
	}
}
