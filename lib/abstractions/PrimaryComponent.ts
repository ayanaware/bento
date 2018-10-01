'use strict';

import { SecondaryComponent } from './SecondaryComponent';

export interface PrimaryComponent extends SecondaryComponent {
	name: string;
	required?: boolean;
	dependencies?: string[];
}