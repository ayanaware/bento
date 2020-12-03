export interface ApplicationConfig {
	/** Application Name */
	name?: string;
	/** Application Version */
	version?: string;

	/** Default Variable Files */
	defaults?: Array<Array<string>>;
	/** Variable Files */
	variables?: Array<Array<string>>;

	/** Plugin Directories */
	plugins?: Array<Array<string>>; 
	/** Component Directories */
    components?: Array<Array<string>>;
}
