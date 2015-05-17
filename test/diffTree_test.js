

var MirrorTree = require('../lib/Mirror/MirrorTree');
var TestEmitter = require('./mirror-diff/TestEmitter');
var diffMirrorTree = require('../lib/Mirror-Diff/diffMirrorTree');
var updateMirrorTree = require('../lib/Mirror-Diff/updateMirrorTree');


exports.testFailed = function(test)
{
	var mirror;
	mirror = new MirrorTree(null);
	mirror.tree = {
		'': false
	};

	test.equal(false, diffMirrorTree(mirror));
	test.done();
};


exports.testTree = function(test)
{
	var mirror;
	mirror = new MirrorTree(null);
	mirror.tree = {
		'': {},
		'/app': {},
		'/app/config': true,
		'/www': {},
		'/www/less': {},
		'/libs': false
	};

	var opEmitter = new TestEmitter();
	diffMirrorTree(mirror, opEmitter);

	test.deepEqual([
		['putDir', '/libs', {}],
		['deleteFile', '/app/config'],
		['putDir', '/app/config', {}]
	], opEmitter.changes);

	test.done();
};


exports.testSymlink = function(test)
{
	var mirror;
	mirror = new MirrorTree(null);
	mirror.tree = {
		'': {},
		'/app': {},
		'/app/config': true,
		'/www': {},
		'/www/less': {},
		'/libs': false
	};

	mirror.pointtype['/app/config'] = [MirrorTree.TYPE_SYMLINK, '../config'];

	var opEmitter = new TestEmitter();
	diffMirrorTree(mirror, opEmitter);

	test.deepEqual([
		['putDir', '/libs', {}],
		['deleteFile', '/app/config'],
		['putSymlink', '/app/config', '../config']
	], opEmitter.changes);

	updateMirrorTree(mirror);

	test.deepEqual({
		'': {},
		'/app': {},
		'/app/config': {},
		'/www': {},
		'/www/less': {},
		'/libs': {}
	}, mirror.tree);

	var opEmitter = new TestEmitter();
	diffMirrorTree(mirror, opEmitter);
	test.deepEqual([], opEmitter.changes);

	test.done();
}
