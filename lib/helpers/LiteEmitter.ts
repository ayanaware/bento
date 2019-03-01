
export type LiteEmitterHandler = (...args: Array<any>) => void;

/**
 * LiteEmitter is a very basic implementation of a eventemitter.
 */
export class LiteEmitter {
	private handlers: Map<string, Set<LiteEmitterHandler>> = new Map();

	public addListener(name: string, fn: LiteEmitterHandler) {
		// create new set if required
		if (!this.handlers.has(name)) this.handlers.set(name, new Set());

		// add the new handler
		const handlers = this.handlers.get(name);
		handlers.add(fn);
	}

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

	public emit(name: string, ...args: Array<any>) {
		const handlers = this.handlers.get(name);
		if (!handlers) return;

		for (const handler of handlers) {
			try {
				handler(...args);
			}	catch (e) {
				// TODO: determine what we should do here :thonk:
			}
		}
	}
}
