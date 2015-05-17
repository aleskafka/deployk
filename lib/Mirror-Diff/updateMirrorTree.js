
var p = require('deployk-utils').path;

var UntreeEmitter = require('./UntreeEmitter');
var emitOp = require('./emitOp');
var diffMirrorTree = require('./diffMirrorTree');


/**
 * @param {MirrorSync}
 * @param {MirrorSync}
 */
module.exports = function(mirrorTree)
{
	diffMirrorTree(mirrorTree, new UpdateEmitter(mirrorTree));
};


function dirname(path)
{
	if (path.indexOf('/')===-1) {
		return '';

	} else {
		return p.dirname(path);
	}
};


function UpdateEmitter(mirrorTree)
{
	this.mirrorTree = mirrorTree;
};


UpdateEmitter.prototype.emitOp = emitOp;


UpdateEmitter.prototype.deleteDir = function(dest)
{
	this.mirrorTree.tree[dest] = false;
	delete this.mirrorTree.stat[dest];
};


UpdateEmitter.prototype.deleteFile = function(dest)
{
	this.mirrorTree.tree[dest] = false;
	delete this.mirrorTree.stat[dest];
};


UpdateEmitter.prototype.putDir = function(dest)
{
	this.mirrorTree.tree[dest] = {};
};


UpdateEmitter.prototype.putSymlink = function(dest)
{
	this.mirrorTree.tree[dest] = {};
};


UpdateEmitter.prototype.putFile = function(dest)
{
	this.mirrorTree.tree[dest] = true;
};
