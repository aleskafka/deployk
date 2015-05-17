

var RuleList = require('../lib/Rule/RuleList');
var MirrorSync = require('../lib/Mirror/MirrorSync');
var MirrorClient = require('../lib/Mirror/MirrorClient');
var client = require('./mirror/local');

var ruleList, sync1, sync2, sync3, sync4;

ruleList = new RuleList();
ruleList.addKeepDir('app/temp');

sync1 = ruleList.addSync('www', 'www').ignoreDir('less', false);
sync2 = ruleList.addSync('app', 'app').ignoreDir('sessions', true);
sync3 = ruleList.addSync('remote_config.neon', 'app/config.neon');
sync4 = ruleList.addSync('missing.neon', 'app/config/missing.neon');


exports.www = function(test) {
	var mirror = new MirrorSync(new MirrorClient(client, sync1.localDir), sync1, ruleList);
	mirror.prepare('');

	mirror.run(function() {
		test.deepEqual({
			'': {
				'index.php': true,
				'assets': true
			},
			'index.php': true,
			'assets': {
				'less': false,
				'combined.css': true
			},
			'assets/less': {
				'combined.less': false,
				'mixins.less': false
			},
			'assets/less/combined.less': false,
			'assets/less/mixins.less': false,
			'assets/combined.css': true
		}, mirror.tree);

		test.done();
	});
};


exports.wwwAssets = function(test) {
	var mirror = new MirrorSync(new MirrorClient(client, sync1.localDir), sync1, ruleList);

	mirror.prepare('assets');

	var tree = {
		'assets': {
			'less': false,
			'combined.css': true
		},
		'assets/less': {
			'combined.less': false,
			'mixins.less': false
		},
		'assets/less/combined.less': false,
		'assets/less/mixins.less': false,
		'assets/combined.css': true
	};

	mirror.run(function() {

		test.deepEqual(tree, mirror.tree);

		// make changes to tree:
		mirror.tree['assets']['combined.css'] = false;
		mirror.tree['assets/combined.css'] = false;

		mirror.prepare('assets');

		mirror.run(function() {
			test.notDeepEqual(tree, mirror.tree);

			mirror.purge('assets');
			mirror.prepare('assets');

			test.deepEqual({}, mirror.tree);
			test.deepEqual({}, mirror.walked);

			mirror.run(function() {
				test.deepEqual(tree, mirror.tree);
				test.done();
			});
		});
	});
};


exports.app = function(test) {
	var mirror = new MirrorSync(new MirrorClient(client, sync2.localDir), sync2, ruleList);
	mirror.prepare('index.php', true);
	mirror.prepare('.', true);

	mirror.run(function() {

		test.deepEqual({
			'': {
				'config': true,
				'bootstrap.php': true,
				'templates': true
			},
			'config': true,
			'bootstrap.php': true,
			'templates': {
				'@layout.latte': true,
				'FrontModule': true
			},
			'templates/@layout.latte': true,
			'templates/FrontModule': {
				'default.latte': true
			},
			'templates/FrontModule/default.latte': true
		}, mirror.tree);

		test.deepEqual([''], Object.keys(mirror.fixed));

		mirror.purge('.');
		test.deepEqual({}, mirror.tree);

		test.done();
	});
};


exports.file = function(test) {
	var mirror = new MirrorSync(new MirrorClient(client, sync3.localDir), sync3, ruleList);
	mirror.prepare('');

	mirror.run(function() {
		test.deepEqual({
			'': true
		}, mirror.tree);

		test.done();
	});
};

exports.file2 = function(test) {
	var mirror = new MirrorSync(new MirrorClient(client, sync4.localDir), sync4, ruleList);
	mirror.prepare('');

	mirror.run(function() {
		test.deepEqual({}, mirror.tree);

		test.done();
	});
};
