
import { GlobalInstanceOf } from '@ayana/errors';

import { BentoError } from './BentoError';

@GlobalInstanceOf('@ayanaware/bento', '1')
export class ComponentError extends BentoError { }
