
var p = require('deployk-utils').path;


module.exports = UntreeEmitter;


/**
 * @param {object}
 * @constructor
 */
function UntreeEmitter(opEmitter)
{
	/** @var {object} */
	this.opEmitter = opEmitter;
};


UntreeEmitter.prototype.emitOp = require('./emitOp');


/**
 * @param {string}
 * @param {object}
 */
UntreeEmitter.prototype.putDir = function(dest, tree)
{
	var file, filepath, putTree = {};

	putTree[dest] = {};
	this.opEmitter.emitOp('putDir', dest, putTree);

	for (file in tree[dest]) {
		filepath = p.join(dest, file);

		if (typeof tree[filepath] === 'object') {
			this.putDir(filepath, this.createTree_(tree, filepath));

		} else {
			this.opEmitter.emitOp('putFile', filepath, tree[filepath]===true ? filepath : tree[filepath]);
		}
	}
};


/**
 * @param {string}
 * @param {object}
 */
UntreeEmitter.prototype.deleteDir = function(dest, tree)
{
	var file, filepath, deleteTree = {};

	for (file in tree[dest]) {
		filepath = p.join(dest, file);

		if (typeof tree[filepath] === 'object') {
			this.deleteDir(filepath, this.createTree_(tree, filepath));

		} else {
			this.opEmitter.emitOp('deleteFile', filepath);
		}
	}

	deleteTree[dest] = {};
	this.opEmitter.emitOp('deleteDir', dest, deleteTree);
};


/**
 * @param {object}
 * @param {string}
 * @return {object}
 */
UntreeEmitter.prototype.createTree_ = function(tree, dest)
{
	var ret = {};
	for (var file in tree) {
		if (file===dest || file.indexOf(dest + '/')===0) {
			ret[file] = tree[file];
		}
	}

	return ret;
};
