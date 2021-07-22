import { Application } from './application';
import { Bento } from './Bento';
import {
	Component, ComponentReference,
	Entity, EntityReference,
	Plugin, PluginReference
} from './entities';
import { EntityManager } from './entities/internal';
import { PropertyManager } from './properties/internal';
import { VariableManager } from './variables/internal';

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

export function setProperty(name: string, value: any) {
	return getPropertyManager().setProperty(name, value);
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

export async function getEntity<T extends Entity>(reference: EntityReference<T>): Promise<T> {
	return getEntityManager().getEntity<T>(reference);
}

export async function getPlugin<T extends Plugin>(reference: PluginReference<T>): Promise<T> {
	return getEntityManager().getPlugin<T>(reference);
}

export async function getComponent<T extends Component>(reference: ComponentReference<T>): Promise<T> {
	return getEntityManager().getComponent<T>(reference);
}
