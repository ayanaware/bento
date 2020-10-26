
import { Component } from '@ayanaware/bento';
import { CommandExecute } from './CommandExecute';

export interface Command extends Component {
	command: string;
	execute(arg?: CommandExecute): Promise<any>;
}
