'use strict';

import { SecondaryComponent } from './SecondaryComponent';

export class PrimaryComponent extends SecondaryComponent {
	name: string;
	required?: boolean;
	dependencies?: string[];
}
