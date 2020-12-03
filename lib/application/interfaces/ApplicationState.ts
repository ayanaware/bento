import { BentoState } from '../../interfaces';

export interface ApplicationState {
	state: BentoState;
	entityFiles: Array<string>;
	variableFiles: Array<string>;
}
