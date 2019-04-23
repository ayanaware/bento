'use strict';

import { Component } from './Component';

import { ComponentReference } from '../@types/ComponentReference';

export interface PendingComponentInfo {
	name: string;
	component: Component;
	missing: Array<ComponentReference>;
}
