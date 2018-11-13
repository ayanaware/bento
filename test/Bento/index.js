'use strict';

describe('Bento', function () {
	require('./setProperty');
	require('./getProperty');
	require('./setProperties');

	require('./setVariable');
	require('./getVariable');

	require('./addPlugin');
	require('./removePlugin');
	require('./registerPlugin');

	require('./addPrimaryComponent');
	require('./removePrimaryComponent');
	require('./registerPrimaryComponent');

	require('./getMissingDependencies');
});
