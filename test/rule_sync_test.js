
var Sync = require('../lib/Rule/Sync');

exports.syncEmpty = function(test) {
	var sync = new Sync('/app', '/app');

	test.same(false, sync.localMonitored('/www/index.php'));
	test.same(Sync.MONITOR, sync.isFileIgnored('/app/bootstrap.php'));
	test.same(Sync.MONITOR, sync.isFileIgnored('/app'));
	test.same(Sync.MONITOR, sync.isDirIgnored('/app'));

	test.same(Sync.MONITOR, sync.isFileIgnored('/bootstrap.php'));

	test.done();
};


exports.syncDir = function(test)
{
	var sync = new Sync('/app', '/app');
	sync.ignoreDir('/sessions', true);
	sync.ignoreDir('temp', true);
	sync.ignoreDir('public/*', false);

	test.same(Sync.MONITOR, sync.isDirIgnored(''));

	test.same(Sync.IGNORE_KEEP, sync.isDirIgnored('/sessions'));
	test.same(Sync.IGNORE_KEEP, sync.isDirIgnored('sessions'));

	test.same(Sync.MONITOR, sync.isDirIgnored('/public'));
	test.same(Sync.IGNORE_REMOVE, sync.isDirIgnored('/public/dir'));
	test.same(Sync.MONITOR, sync.isFileIgnored('/public/file'));

	test.same(Sync.MONITOR, sync.isDirIgnored('/templates'));
	test.same(Sync.IGNORE_KEEP, sync.isDirIgnored('/temp'));
	test.same(Sync.IGNORE_KEEP, sync.isDirIgnored('/templates/temp'));

	test.done();
}


exports.syncFile = function(test)
{
	var sync = new Sync('/app', '/app');
	sync.ignoreDir('/sessions', true);
	sync.ignoreFile('**/*.less', false);
	sync.ignoreFile('*.css', false);

	test.same(Sync.MONITOR, sync.isFileIgnored(''));

	test.same(Sync.IGNORE_KEEP, sync.isFileIgnored('/sessions/sess_1'));
	test.same(Sync.MONITOR, sync.isFileIgnored('/template/sessions/sess_1'));

	test.same(Sync.IGNORE_REMOVE, sync.isFileIgnored('/less/combined.less'));
	test.same(Sync.IGNORE_REMOVE, sync.isFileIgnored('/combined.less'));

	test.same(Sync.MONITOR, sync.isFileIgnored('/less/combined.css'));
	test.same(Sync.IGNORE_REMOVE, sync.isFileIgnored('combined.css'));

	test.done();
};


exports.syncDirAsterix = function(test)
{
	var sync = new Sync('/app', '/app');
	sync.ignoreDir('temp*', false);

	test.same(Sync.IGNORE_REMOVE, sync.isDirIgnored('/temp'));
	test.same(Sync.IGNORE_REMOVE, sync.isDirIgnored('/template'));
	test.same(Sync.MONITOR, sync.isDirIgnored('/_temp'));
	test.same(Sync.MONITOR, sync.isDirIgnored('../app'));

	test.same(false, sync.localMonitored('/www'));
	test.same('.', sync.localMonitored('/'));
	test.same('.', sync.localMonitored('/app'));
	test.same('.', sync.localMonitored('/app/'));
	test.same('index.js', sync.localMonitored('/app/index.js'));

	test.done();
};


exports.syncRelative = function(test)
{
	var sync = new Sync('app', 'app');

	test.same(Sync.MONITOR, sync.isDirIgnored('sessions'));
	test.same(Sync.MONITOR, sync.isDirIgnored('../app'));
	test.same(false, sync.localMonitored('..'));
	test.same(false, sync.localMonitored('www'));

	test.done();
}
