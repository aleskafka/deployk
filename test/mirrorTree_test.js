

var MirrorTree = require('../lib/Mirror/MirrorTree');
var Mockfs = require('./lib/Mockfs');
var client = require('./mirror/local');


function testMirrorTree(test, client, startpoint, expect, cb)
{
	var mirror = new MirrorTree(client);
	startpoint.forEach(function(startpoint) {
		mirror.prepare(startpoint);
	});

	mirror.run(function() {
		test.deepEqual(expect, mirror.tree);

		if (cb) {
			cb();

		} else {
			test.done();
		}
	});

	return mirror;
}


exports.appAndConfig = function(test) {
	var mirror;

	mirror = testMirrorTree(test, client, ['/app', '/app/config/config.neon'], {
		'': {},
		'app': {},
		'app/config': true
	}, function() {
		process.nextTick(function() {
			mirror.purge('app/config');
			test.deepEqual({'': {}, 'app': {}, 'app/config': false}, mirror.tree);
			mirror.purge('app');
			test.deepEqual({'': {}, 'app': false, 'app/config': false}, mirror.tree);
			mirror.purge('');
			test.deepEqual({'': false, 'app': false, 'app/config': false}, mirror.tree);

			mirror.run(function() {
				test.deepEqual({
					'': {},
					'app': {},
					'app/config': true
				}, mirror.tree);
				test.done();
			});
		})
	});
};


exports.appConfig = function(test) {
	testMirrorTree(test, client, ['/app/config/config.neon'], {
		'': {},
		'app': {},
		'app/config': true
	});
};


exports.app = function(test) {
	testMirrorTree(test, client, ['/app'], {
		'': {}
	});
};


exports.empty = function(test) {
	testMirrorTree(test, new Mockfs({}), ['/app', '/app/config/config.neon', '/libs', '/temp/.htaccess'], {
		'': {},
		'app': false,
		'app/config': false,
		'temp': false
	});
};
