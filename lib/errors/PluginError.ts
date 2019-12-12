
import { GlobalInstanceOf } from '@ayanaware/errors';

import { BentoError } from './BentoError';

@GlobalInstanceOf('@ayanaware/bento', '1')
export class PluginError extends BentoError { }
