/**
 * Similar to Typescripts global InstanceType<T> except not abstract
 */
export type InstanceType<T> = new (...args: Array<any>) => T;
