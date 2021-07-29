import type { Bento } from './Bento';
import type { Application } from './application/Application';
import { EntityManager } from './entities/EntityManager';
import { Component } from './entities/interfaces/Component';
import { Entity } from './entities/interfaces/Entity';
import { Plugin } from './entities/interfaces/Plugin';
import { ComponentReference } from './entities/types/ComponentReference';
import { EntityReference } from './entities/types/EntityReference';
import { PluginReference } from './entities/types/PluginReference';
import { PropertyManager } from './properties/PropertyManager';
import { VariableManager } from './variables/VariableManager';

/**
 * Global Application Instance
 */
let application: Application;

/**
 * Define Application instance `getApplication()` returns
 * @param applicaton Application instance
 * @param force Force override. Only use if you know what you're doing.
 */
export function useApplication(instance: Application, force?: boolean): void {
	if (application && !force) throw new Error('Application instance already in use');

	application = instance;
}

export function getApplication(): Application {
	if (!application) throw new Error('Application instance not found.');

	return application;
}

/**
 * Global Bento Instance
 */
let bento: Bento;

/**
 * Define Bento instance `getBento()` returns
 *
 * This function will mostly be called internally by Bento in it's constructor
 *
 * @param bento Bento instance
 * @param force Force override. Only use if you know what you're doing.
 */
export function useBento(instance: Bento, force?: boolean): void {
	if (bento && !force) throw new Error('Bento instance already in use.');

	bento = instance;
}

/**
 * Bento Instance
 * @returns Bento
 */
export function getBento(): Bento {
	if (!bento) throw new Error('Bento instance not found. Have you `new Bento();`?');

	return bento;
}

// PROPERTIES

/**
 * Bento PropertyManager Instance
 */
export function getPropertyManager(): PropertyManager {
	return getBento().properties;
}

export function hasProperty(name: string): boolean {
	return getPropertyManager().hasProperty(name);
}

export function getProperty<T>(name: string): T {
	return getPropertyManager().getProperty<T>(name);
}

export function setProperty<T>(name: string, value: T): T {
	return getPropertyManager().setProperty<T>(name, value);
}

// VARIABLES

/**
 * Bento VariableManager Instance
 */
export function getVariableManager(): VariableManager {
	return getBento().variables;
}

export function hasVariable(name: string): boolean {
	return getVariableManager().hasVariable(name);
}

export function getVariable<T>(name: string, def?: T): T {
	return getVariableManager().getVariable<T>(name, def);
}

export function setVariable<T>(name: string, value: T): T {
	return getVariableManager().setVariable<T>(name, value);
}

// ENTITIES

/**
 * Bento EntityManager Instance
 */
export function getEntityManager(): EntityManager {
	return getBento().entities;
}

export function getEntity<T extends Entity>(reference: EntityReference<T>): T {
	return getEntityManager().getEntity<T>(reference);
}

export function getPlugin<T extends Plugin>(reference: PluginReference<T>): T {
	return getEntityManager().getPlugin<T>(reference);
}

export function getComponent<T extends Component>(reference: ComponentReference<T>): T {
	return getEntityManager().getComponent<T>(reference);
}
