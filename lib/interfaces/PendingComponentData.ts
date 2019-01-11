'use strict';

import { Component } from './Component';

export interface PendingComponentInfo {
	name: string;
	component: Component;
	missing: Array<Component | string | any>;
}
