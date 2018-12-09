'use strict';

export enum VariableSourceType {
	ENV = 'env',
	FILE = 'file',
	INLINE = 'inline',
	// Unspecified is only valid when fetching a source that is not defined. You cannot actively set a source to unspecified
	UNSPECIFIED = 'unspecified',
}

export interface VariableSource {
	type: VariableSourceType;
	source?: string;
}
