

var MirrorSync = require('../lib/Mirror/MirrorSync');
var MirrorClient = require('../lib/Mirror/MirrorClient');
var TestEmitter = require('./mirror-diff/TestEmitter');
var diffMirrorSync = require('../lib/Mirror-Diff/diffMirrorSync');
var updateMirrorSync = require('../lib/Mirror-Diff/updateMirrorSync');

var RuleList = require('../lib/Rule/RuleList');
var local = require('./mirror-diff/local');
var remote = require('./mirror-diff/remote');

var ruleList, sync;

ruleList = new RuleList();
ruleList.addSync('/app', '/remote/app2');
ruleList.addSync('/remote_config.neon', '/remote/app/config.neon');

sync = ruleList.addSync('/app', '/remote/app').
	ignoreDir('sessions', true).
	ignoreDir('keep', true).
	ignoreFile('**/remove_file.js', false);


exports.test = function(test)
{
	var doneFrom = false, doneTo = false;

	var mirrorFrom = new MirrorSync(new MirrorClient(local, sync.localDir), sync, ruleList);
	mirrorFrom.prepare('');

	mirrorFrom.run(function() {
		doneFrom = true;

		if (doneTo) {
			testMirror();
		}
	});

	var mirrorTo = new MirrorSync(new MirrorClient(remote, sync.remoteDir), sync, ruleList);
	mirrorTo.prepare('');

	mirrorTo.run(function() {
		doneTo = true;

		if (doneFrom) {
			testMirror();
		}
	});

	function testMirror()
	{
		var opEmitter = new TestEmitter();
		diffMirrorSync(mirrorFrom, mirrorTo, opEmitter);

		test.deepEqual([
			['dir', '', true],
			['putDir', 'libs', { 'libs': { 'nette': true }, 'libs/nette': {} }],
			['deleteDir', 'helper', {'helper': {}}],
			['putFile', 'helper', 'helper'],
			['putDir', 'subtree', {'subtree': {}}],
			['deleteFile', 'services'],
			['putDir', 'services', { 'services': { 'user.php': true }, 'services/user.php': true }],
			['dir', 'templates', true],
			['file', 'bootstrap.php', 'bootstrap.php', true, true],
			['dir', 'templates/FrontModule', true],
			['file', 'templates/@layout.latte', 'templates/@layout.latte', true, true],
			['putFile', 'templates/FrontModule/main.latte', 'templates/FrontModule/main.latte'],
			['file', 'templates/FrontModule/default.latte', 'templates/FrontModule/default.latte', true, true],
			['deleteDir', 'remove/remove', {'remove/remove': {'file.php': true}, 'remove/remove/file.php': true}],
			['deleteFile', 'remove/index.php'],
			['deleteFile', 'templates/FrontModule/remove.latte']
		], opEmitter.changes);

		testUpdate();
	};


	function testUpdate()
	{
		var tree;
		test.deepEqual(tree = {
			'': {
				'bootstrap.php': true,
			    'services': true,
			    'helper': true,
			    'templates': true,
			    'remove': true
			},
			'bootstrap.php': true,
			'services': true,
			'helper': {},
			'templates': { '@layout.latte': true, FrontModule: true },
			'templates/@layout.latte': true,
			'templates/FrontModule': { 'default.latte': true, 'remove.latte': true },
			'templates/FrontModule/default.latte': true,
			'templates/FrontModule/remove.latte': true,
			'remove': { 'index.php': true, remove: true },
			'remove/index.php': true,
			'remove/remove': { 'file.php': true },
			'remove/remove/file.php': true
		}, mirrorTo.tree);

		test.deepEqual(Object.keys(tree).sort(), Object.keys(mirrorTo.stat).sort());
		updateMirrorSync(mirrorFrom, mirrorTo);

		test.deepEqual(tree = {
			'': {
				'bootstrap.php': true,
			    'services': true,
			    'helper': true,
			    'templates': true,
			    'remove': true,
			    'subtree': true,
			    'libs': true
			},
			'bootstrap.php': true,
			'templates': { '@layout.latte': true, FrontModule: true },
			'templates/@layout.latte': true,
			'templates/FrontModule': { 'default.latte': true, 'main.latte': true },
			'templates/FrontModule/default.latte': true,
			'remove': {},
			'libs': {'nette': true},
			'libs/nette': {},
			'helper': true,
			'subtree': {},
			'services': { 'user.php': true},
			'services/user.php': true,
			'templates/FrontModule/main.latte': true
		}, mirrorTo.tree);

		test.deepEqual([
			'',
			'bootstrap.php',
			'templates',
			'templates/@layout.latte',
			'templates/FrontModule',
			'templates/FrontModule/default.latte',
			'remove'
		].sort(), Object.keys(mirrorTo.stat).sort());

		var opEmitter = new TestEmitter();

		opEmitter.ignore('file', 'dir')
		diffMirrorSync(mirrorFrom, mirrorTo, opEmitter);

		test.deepEqual([], opEmitter.changes);

		test.done();
	}
};
