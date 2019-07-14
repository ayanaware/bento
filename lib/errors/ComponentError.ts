
import { GlobalInstanceOf } from '@ayana/errors';

import { BentoError } from './BentoError';

@GlobalInstanceOf('@ayana/bento', '1')
export class ComponentError extends BentoError { }
