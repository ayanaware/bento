import { ContainedType } from '../../Container';
import { Component } from '../interfaces/Component';

export type ComponentReference<T extends Component = Component> = string | Component | ContainedType<T>;
