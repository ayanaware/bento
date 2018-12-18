'use strict';

import { AyanaError, GlobalInstanceOf } from '@ayana/errors';

@GlobalInstanceOf('@ayana/bento', '1')
export class ComponentError extends AyanaError { }
