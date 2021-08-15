import { InstanceType } from '../../types/InstanceType';
import type { Component } from '../interfaces/Component';

export type ComponentReference<T extends Component = Component> = string | Component | InstanceType<T>;
