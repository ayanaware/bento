
import { GlobalInstanceOf } from '@ayanaware/errors';

import { Component } from '../components';

import { ComponentError } from './ComponentError';

@GlobalInstanceOf('@ayanaware/bento', '1')
export class ComponentRegistrationError extends ComponentError {
	public readonly component: Component;

	public constructor(component: Component, msg: string) {
		super(msg);

		this.__define('component', component);
	}
}
