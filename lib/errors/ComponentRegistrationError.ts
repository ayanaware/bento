'use strict';

import { GlobalInstanceOf } from '@ayana/errors';

import { Component } from '../interfaces';

import { ComponentError } from './ComponentError';

@GlobalInstanceOf('@ayana/components', '1')
export class ComponentRegistrationError extends ComponentError {
	public readonly component: Component;

	constructor(component: Component, msg: string) {
		super(msg);

		this.define('component', component);
	}
}
