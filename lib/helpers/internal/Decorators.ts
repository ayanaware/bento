'use strict';

import { ComponentAPI } from '..';
import { Symbols } from '../../constants/internal';
import { Component } from '../../interfaces';
import { DecoratorComponentInjection, DecoratorInjection, DecoratorSubscription, DecoratorSymbolInjection, DecoratorVariable } from '../../interfaces/internal';

/**
 * Utility class for handling decorators on components
 */
export class Decorators {

	/**
	 * Returns all decorator subscriptions of a component
	 *
	 * @param component The component that should be checked
	 */
	public getSubscriptions(component: Component): DecoratorSubscription[] {
		// Check if there is a constructor, if there isn't then there can't be any decorators
		if (component.constructor == null) return [];

		const subscriptions: DecoratorSubscription[] = (component.constructor as any)[Symbols.subscriptions];
		if (Array.isArray(subscriptions)) return subscriptions;

		return [];
	}

	/**
	 * Handles all decorator subscriptions of a component
	 *
	 * @param component The component that should be handled
	 * @param api The components API instance
	 */
	public handleSubscriptions(component: Component, api: ComponentAPI) {
		// Check if there is a constructor, if there isn't then there can't be any decorators
		if (component.constructor == null) return;

		const subscriptions: DecoratorSubscription[] = (component.constructor as any)[Symbols.subscriptions];
		if (Array.isArray(subscriptions)) {
			for (const subscription of subscriptions) {
				api.subscribe(subscription.type, subscription.namespace, subscription.name, subscription.handler, component);
			}
		}
	}

	/**
	 * Returns all decorator injections of a component
	 *
	 * @param component The component that should be checked
	 */
	public getInjections(component: Component): DecoratorInjection[] {
		// Check if there is a constructor, if there isn't then there can't be any decorators
		if (component.constructor == null) return [];

		const injections: DecoratorInjection[] = (component.constructor as any)[Symbols.injections];
		if (Array.isArray(injections)) return injections;

		return [];
	}

	public getSymbolInjections(component: Component): DecoratorSymbolInjection[] {
		return this.getInjections(component).filter(i => typeof i === 'symbol') as DecoratorSymbolInjection[];
	}

	public getComponentInjections(component: Component): DecoratorComponentInjection[] {
		return this.getInjections(component).filter(i => typeof i !== 'symbol') as DecoratorComponentInjection[];
	}

	/**
	 * Handles all decorator injections of a component
	 *
	 * @param component The component that should be handled
	 * @param api The components API instance
	 */
	public handleInjections(component: Component, api: ComponentAPI) {
		for (const injection of this.getInjections(component)) {
			if (injection.symbol != null) {
				// Handle parent injection
				if (injection.symbol === Symbols.parent) {
					api.injectComponent(component.parent, injection.propertyKey);
				}
			} else {
				api.injectComponent(injection.component, injection.propertyKey);
			}
		}
	}

	/**
	 * Handles all decorator variables of a component
	 *
	 * @param component The component that should be handled
	 * @param api The components API instance
	 */
	public handleVariables(component: Component, api: ComponentAPI) {
		// Check if there is a constructor, if there isn't then there can't be any decorators
		if (component.constructor == null) return;

		const variables: DecoratorVariable[] = (component.constructor as any)[Symbols.variables];
		if (Array.isArray(variables)) {
			for (const variable of variables) {
				api.injectVariable(Object.assign({}, variable.definition, { property: variable.propertyKey }));
			}
		}
	}

	public getDecoratorParent(component: Component): Function {
		// Check if there is a constructor, if there isn't then there can't be any decorators
		if (component.constructor == null) return null;

		const parent: Function = (component.constructor as any)[Symbols.childOf];

		return parent || null;
	}

}
