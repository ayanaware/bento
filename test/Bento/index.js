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

	require('./addPrimaryComponent');
	require('./removePrimaryComponent');

	require('./resolveDependencies');
	require('./getMissingDependencies');

	require('./registerComponent');
});
