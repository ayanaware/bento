export enum VariableSourceType {
	ENV = 'env',
	INLINE = 'inline',
}

export interface VariableSource {
	type: VariableSourceType;
	source?: string;
}
