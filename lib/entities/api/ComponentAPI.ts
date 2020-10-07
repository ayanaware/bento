import { Bento } from '../../Bento';
import { Component } from '../interfaces';

import { SharedAPI } from './SharedAPI';

/**
 * The gateway of a component to the rest of the application.
 * Each component gets one if loaded.
 */
export class ComponentAPI extends SharedAPI {
	public constructor(bento: Bento, component: Component) {
		super(bento);

		this.entity = component;
	}
}
