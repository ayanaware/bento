'use strict';

import { Component, ComponentAPI } from '../../components';

import { DecoratorSymbols } from './DecoratorSymbols';
import {
	DecoratorComponentInjection,
	DecoratorInjection,
	DecoratorSubscription,
	DecoratorSymbolInjection,
	DecoratorVariable,
} from './interfaces';

/**
 * Utility class for handling decorators on components
 */
export class DecoratorConsumer {
	/**
	 * Returns all decorator subscriptions of a component
	 *
	 * @param component The component that should be checked
	 *
	 * @returns Array of DecoratorSubscriptions
	 */
	public static getSubscriptions(component: Component): Array<DecoratorSubscription> {
		// Check if there is a constructor, if there isn't then there can't be any decorators
		if (component.constructor == null) return [];

		const subscriptions: Array<DecoratorSubscription> = (component.constructor as any)[DecoratorSymbols.subscriptions];
		if (Array.isArray(subscriptions)) return subscriptions;

		return [];
	}

	/**
	 * Handles all decorator subscriptions of a component
	 *
	 * @param component The component that should be handled
	 * @param api The components API instance
	 */
	public static handleSubscriptions(component: Component, api: ComponentAPI) {
		// Check if there is a constructor, if there isn't then there can't be any decorators
		if (component.constructor == null) return;

		const subscriptions: Array<DecoratorSubscription> = (component.constructor as any)[DecoratorSymbols.subscriptions];
		if (Array.isArray(subscriptions)) {
			for (const subscription of subscriptions) {
				api.subscribe(subscription.namespace, subscription.name, subscription.handler, component);
			}
		}
	}

	/**
	 * Returns all decorator injections of a component
	 *
	 * @param component The component that should be checked
	 *
	 * @returns Array of DecoratorInjections
	 */
	public static getInjections(component: Component): Array<DecoratorInjection> {
		// Check if there is a constructor, if there isn't then there can't be any decorators
		if (component.constructor == null) return [];

		const injections: Array<DecoratorInjection> = (component.constructor as any)[DecoratorSymbols.injections];
		if (Array.isArray(injections)) return injections;

		return [];
	}

	public static getSymbolInjections(component: Component): Array<DecoratorSymbolInjection> {
		return DecoratorConsumer.getInjections(component).filter(i => typeof i === 'symbol') as Array<DecoratorSymbolInjection>;
	}

	public static getComponentInjections(component: Component): Array<DecoratorComponentInjection> {
		return DecoratorConsumer.getInjections(component).filter(i => typeof i !== 'symbol') as Array<DecoratorComponentInjection>;
	}

	/**
	 * Handles all decorator injections of a component
	 *
	 * @param component The component that should be handled
	 * @param api The components API instance
	 */
	public static handleInjections(component: Component, api: ComponentAPI) {
		for (const injection of DecoratorConsumer.getInjections(component)) {
			if (injection.symbol != null) {
				// Handle parent injection
				if (injection.symbol === DecoratorSymbols.parent) {
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
	public static handleVariables(component: Component, api: ComponentAPI) {
		// Check if there is a constructor, if there isn't then there can't be any decorators
		if (component.constructor == null) return;

		const variables: Array<DecoratorVariable> = (component.constructor as any)[DecoratorSymbols.variables];
		if (Array.isArray(variables)) {
			for (const variable of variables) {
				api.injectVariable(variable.definition, variable.propertyKey);
			}
		}
	}

	public static getDecoratorParent(component: Component): Function {
		// Check if there is a constructor, if there isn't then there can't be any decorators
		if (component.constructor == null) return null;

		const parent: Function = (component.constructor as any)[DecoratorSymbols.childOf];

		return parent || null;
	}
}
