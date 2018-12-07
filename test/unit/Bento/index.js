'use strict';

describe('Bento', function () {
	require('./setProperty');
	require('./getProperty');
	require('./setProperties');

	require('./setVariable');
	require('./getVariable');

	require('./addValidator');
	require('./removeValidator');
	require('./runValidator');

	require('./addPlugin');
	require('./removePlugin');
	require('./registerPlugin');

	require('./resolveComponentName');

	require('./prepareComponent');

	require('./addComponent');
	require('./removeComponent');

	require('./resolveDependencies');
	require('./getMissingDependencies');

	require('./loadComponent');
});
