'use strict';

import { ComponentAPI } from '..';
import { Symbols } from '../../constants/internal';
import { Component } from '../../interfaces';
import { DecoratorInjection, DecoratorSubscription, DecoratorVariable } from '../../interfaces/internal';

/**
 * Utility class for handling decorators on components
 */
export class Decorators {

	/**
	 * Handles all decorator subscriptions of a component
	 *
	 * @param component The component that should be handled
	 * @param api The components API instance
	 */
	public static handleSubscriptions(component: Component, api: ComponentAPI) {
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
	public static getInjections(component: Component): DecoratorInjection[] {
		// Check if there is a constructor, if there isn't then there can't be any decorators
		if (component.constructor == null) return [];

		const injections: DecoratorInjection[] = (component.constructor as any)[Symbols.injections];
		if (Array.isArray(injections)) return injections;

		return [];
	}

	/**
	 * Handles all decorator injections of a component
	 *
	 * @param component The component that should be handled
	 * @param api The components API instance
	 */
	public static handleInjections(component: Component, api: ComponentAPI) {
		for (const injection of Decorators.getInjections(component)) {
			api.injectComponent(injection.component, injection.propertyKey);
		}
	}

	/**
	 * Handles all decorator variables of a component
	 *
	 * @param component The component that should be handled
	 * @param api The components API instance
	 */
	public static handleVariables(component: Component, api: ComponentAPI) {
		// Check if there is a constructor, if there isn't then there can't be any decorators
		if (component.constructor == null) return;

		const variables: DecoratorVariable[] = (component.constructor as any)[Symbols.variables];
		if (Array.isArray(variables)) {
			for (const variable of variables) {
				api.injectVariable(Object.assign({}, variable.definition, { property: variable.propertyKey }));
			}
		}
	}

}
