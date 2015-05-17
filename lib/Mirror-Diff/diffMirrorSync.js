

var p = require('deployk-utils').path;
var cloneTree = require('./cloneTree');


/**
 * @param {MirrorSync}
 * @param {MirrorSync}
 * @param {object}
 */
module.exports = function(mirrorFrom, mirrorTo, opEmitter)
{
	new DiffMirrorSync(mirrorFrom, mirrorTo, opEmitter);
}


/**
 * @param {MirrorSync}
 * @param {MirrorSync}
 * @constructor
 */
function DiffMirrorSync(mirrorFrom, mirrorTo, opEmitter)
{
	/** @var {MirrorSync} */
	this.mirrorFrom = mirrorFrom;

	/** @var {MirrorSync} */
	this.mirrorTo = mirrorTo;

	/** @var {object} */
	this.treeFrom = cloneTree(mirrorFrom.tree);

	/** @var {object} */
	this.treeTo = cloneTree(mirrorTo.tree);

	/** @var {object} */
	this.opEmitter = opEmitter;

	this.run();
};


/**
 * @param {object}
 */
DiffMirrorSync.prototype.run = function()
{
	var path;
	while ((path = this.findPath(this.treeFrom)) !== false) {
		this.diffFrom(path);
		delete this.treeFrom[path];
		delete this.treeTo[path];
	}

	while ((path = this.findPath(this.treeTo)) !== false) {
		this.diffTo(path);
		delete this.treeTo[path];
	}
};


/**
 * @param {object}
 * @return {string|false}
 * @private
 */
DiffMirrorSync.prototype.findPath = function(tree)
{
	var path = false;
	for (var key in tree) {
		if (path===false || key.length<path.length) {
			path = key;
		}
	}

	return path;
};


/**
 * @param {string}
 * @private
 */
DiffMirrorSync.prototype.diffFrom = function(path)
{
	if (this.treeFrom[path] === true) {
		if (path in this.treeTo) {
			if (typeof this.treeTo[path] === 'object') {
				this.opEmitter.emitOp('deleteDir', path, this.createTree(this.treeTo, path));
				this.opEmitter.emitOp('putFile', path, path);

			} else if ((path in this.mirrorTo.stat) && (path in this.mirrorFrom.stat)) {
				this.opEmitter.emitOp('file', path, path, this.mirrorTo.stat[path], this.mirrorFrom.stat[path]);
			}

		} else {
			this.opEmitter.emitOp('putFile', path, path);
		}

	} else if (typeof this.treeFrom[path] === 'object') {
		if (path in this.treeTo && this.treeTo[path] === true) {
			this.opEmitter.emitOp('deleteFile', path);
			delete this.treeTo[path];
		}

		if (path in this.treeTo) {
			if (path in this.mirrorTo.stat) {
				this.opEmitter.emitOp('dir', path, this.mirrorTo.stat[path]);
			}

		} else {
			this.opEmitter.emitOp('putDir', path, this.createTree(this.treeFrom, path));
		}
	}
};


/**
 * @param {string}
 * @private
 */
DiffMirrorSync.prototype.diffTo = function(path)
{
	if (typeof this.treeTo[path] === 'object') {
		if (!(path in this.mirrorTo.fixed)) {
			this.opEmitter.emitOp('deleteDir', path, this.createTree(this.treeTo, path));
		}

	} else if (path in this.treeTo) {
		this.opEmitter.emitOp('deleteFile', path);
	}
};


/**
 * @param {object}
 * @param {string}
 * @param {object}
 * @private
 */
DiffMirrorSync.prototype.createTree = function(tree, path, ret)
{
	ret = ret || {};

	if (tree[path]===true) {
		ret[path] = true;

	} else if (typeof tree[path] === 'object') {
		ret[path] = {};

		for (var file in tree[path]) {
			if (tree[path][file]===true) {
				ret[path][file] = true;
				this.createTree(tree, p.join(path, file), ret);

			} else {
				delete tree[p.join(path, file)];
			}
		}
	}

	delete tree[path];
	return ret;
};
