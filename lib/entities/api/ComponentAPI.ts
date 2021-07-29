import type { Bento } from '../../Bento';
import type { Component } from '../interfaces/Component';

import { EntityAPI } from './EntityAPI';

/**
 * The gateway of a component to the rest of the application.
 * Each component gets one if loaded.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class ComponentAPI extends EntityAPI {
	public constructor(bento: Bento, component: Component) {
		super(bento);

		this.entity = component;
	}
}
