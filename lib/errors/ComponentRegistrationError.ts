'use strict';

import { GlobalInstanceOf } from '@ayana/errors';

import { PrimaryComponent, SecondaryComponent } from '../abstractions';

import { ComponentError } from './ComponentError';

@GlobalInstanceOf('@ayana/components', '1')
export class ComponentRegistrationError extends ComponentError {

	public readonly component: PrimaryComponent | SecondaryComponent;

	constructor(component: PrimaryComponent | SecondaryComponent, msg: string) {
		super(msg);

		this.define('component', component);
	}

}
