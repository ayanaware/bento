'use strict';

import { AyanaError, GlobalInstanceOf } from '@ayana/errors';

@GlobalInstanceOf('@ayana/components', '1')
export class PluginError extends AyanaError { }
