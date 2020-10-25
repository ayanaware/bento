
export interface Type<T> extends Function {
    new(...args: Array<any>): T;
}
