
var p = require('deployk-utils').path;
var rights = require('deployk-utils').rights;

module.exports = DeployEmitter;


/**
 * @param {Object}
 * @param {LocalWrapper}
 * @param {function}
 * @param {function}
 */
function DeployEmitter(opEmitter, local, dirRights, fileRights)
{
	/** @var {Object} */
	this.opEmitter = opEmitter;

	/** @var {LocalWrapper} */
	this.local = local;

	/** @var {function} */
	this.dirRights = dirRights;

	/** @var {function} */
	this.fileRights = fileRights;
}


DeployEmitter.prototype.emitOp = require('../Mirror-Diff/emitOp');


DeployEmitter.prototype.putDir = function(path, tree)
{
	this._putTree(path, tree || {});
};


DeployEmitter.prototype._putTree = function(path, tree)
{
	this.opEmitter.emitOp('putDir', path, this.dirRights(path));

	if (path in tree) {
		Object.keys(tree[path]).forEach(function(child) {
			child = p.join(path, child);

			if (typeof tree[child]==='object') {
				this._putTree(child, tree);

			} else {
				this.putFile(child, tree[child]);
			}
		}, this);
	}
};


DeployEmitter.prototype.dir = function(path, stat)
{
	if (rights.equals(stat, this.dirRights(path)) === false) {
		this.opEmitter.emitOp('chmod', path, this.dirRights(path));
	}
};


DeployEmitter.prototype.file = function(dest, source, destStat, sourceStat)
{
	if (this.local.isFileTouched(source) || destStat.size!==sourceStat.size) {
		this.opEmitter.emitOp('deleteFile', dest);
		this.putFile(dest, source);

	} else if (rights.equals(destStat, this.fileRights(dest)) === false) {
		this.opEmitter.emitOp('chmod', dest, this.fileRights(dest));
	}
};


DeployEmitter.prototype.putFile = function(dest, source)
{
	if (this.local.isFileStream(source)) {
		this.opEmitter.emitOp('putContent', dest, this.local.createFile(source), this.fileRights(source));

	} else {
		this.opEmitter.emitOp('putFile', dest, this.local.createFile(source), this.fileRights(source));
	}
};
