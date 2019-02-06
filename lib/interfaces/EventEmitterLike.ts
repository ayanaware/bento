
export interface EventEmitterLike {
	emit(event: string | symbol, ...args: any[]): boolean;
	addListener(event: string | symbol, listener: (...args: any[]) => void): EventEmitterLike | any;
	removeListener(event: string | symbol, listener: (...args: any[]) => void): EventEmitterLike | any;
}
