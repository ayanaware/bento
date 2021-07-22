import { ContainedType } from '../../Container';
import { Plugin } from '../interfaces/Plugin';

export type PluginReference<T extends Plugin = Plugin> = string | Plugin | ContainedType<T>;
