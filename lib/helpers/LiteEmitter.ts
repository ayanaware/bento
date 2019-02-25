
export type LiteEmitterHandler = (...args: any[]) => void;

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
		if (fn && handlers.has(fn)) handlers.delete(fn);
		else {
			// delete all handlers
		}

		// if no handlers left, delete the set
		if (handlers.size === 0) {
			
		}
	}
}
