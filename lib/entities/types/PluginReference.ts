import { InstanceType } from '../../types/InstanceType';
import type { Plugin } from '../interfaces/Plugin';

export type PluginReference<T extends Plugin = Plugin> = string | Plugin | InstanceType<T>;
