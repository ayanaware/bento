
export interface EventEmitterLike {
	emit(event: string | symbol, ...args: Array<any>): boolean | void;
	addListener(event: string | symbol, listener: (...args: Array<any>) => void): EventEmitterLike | any;
	removeListener(event: string | symbol, listener: (...args: Array<any>) => void): EventEmitterLike | any;
}
