'use strict';

import { AyanaError, GlobalInstanceOf } from '@ayana/errors';

@GlobalInstanceOf('@ayana/components', '1')
export class ComponentError extends AyanaError { }
