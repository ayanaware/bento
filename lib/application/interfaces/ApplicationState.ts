import { BentoState } from '../../interfaces/BentoState';

export interface ApplicationState {
	state: BentoState;
	entityFiles: Array<string>;
	variableFiles: Array<string>;
}
