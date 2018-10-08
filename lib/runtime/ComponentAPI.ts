'use strict';

import { ComponentManager } from "./ComponentManager";

export class ComponentAPI {
	private readonly manager: ComponentManager;

	constructor(manager: ComponentManager) {
		this.manager = manager;
	}

	/**
	 * Fetch the provided primary component instance
	 * @param name - Primary component name
	 */
	getPrimary(name: string) {
		const component = this.manager.primary.get(name);
		if (!component) return null;

		return component;
	}

	public async subscribe(namespace: string, eventName: string, handler: () => void) {
	}

	public async unsubscribe(namespace: string, eventName: string, handlerID: string) {
	}
}
