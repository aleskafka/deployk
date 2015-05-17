
var p = require('deployk-utils').path;

var UntreeEmitter = require('./UntreeEmitter');
var emitOp = require('./emitOp');
var diffMirrorSync = require('./diffMirrorSync');


/**
 * @param {MirrorSync}
 * @param {MirrorSync}
 */
module.exports = function(mirrorFrom, mirrorTo)
{
	diffMirrorSync(
		mirrorFrom,
		mirrorTo,
		new UntreeEmitter(new UpdateEmitter(mirrorFrom, mirrorTo))
	);
};


function dirname(path)
{
	if (path.indexOf('/')===-1) {
		return '';

	} else {
		return p.dirname(path);
	}
};


function UpdateEmitter(mirrorFrom, mirrorTo)
{
	this.mirrorFrom = mirrorFrom;
	this.mirrorTo   = mirrorTo;
};


UpdateEmitter.prototype.emitOp = emitOp;


UpdateEmitter.prototype.deleteDir = function(dest)
{
	delete this.mirrorTo.tree[dirname(dest)][p.basename(dest)];
	delete this.mirrorTo.tree[dest];
	delete this.mirrorTo.stat[dest];
};


UpdateEmitter.prototype.deleteFile = function(dest)
{
	delete this.mirrorTo.tree[dirname(dest)][p.basename(dest)];
	delete this.mirrorTo.tree[dest];
	delete this.mirrorTo.stat[dest];
};


UpdateEmitter.prototype.putDir = function(dest)
{
	this.mirrorTo.tree[dirname(dest)][p.basename(dest)] = true;
	this.mirrorTo.tree[dest] = {};
};


UpdateEmitter.prototype.putFile = function(dest)
{
	this.mirrorTo.tree[dirname(dest)][p.basename(dest)] = true;
	this.mirrorTo.tree[dest] = true;
};
