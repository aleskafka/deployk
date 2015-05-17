

var util = require('util');
var cloneTree = require('./cloneTree');
var MirrorTree = require('../Mirror/MirrorTree');


/**
 * @param {MirrorTree}
 * @param {object}
 * @return {boolean}
 */
module.exports = function(mirror, opEmitter)
{
	var tree = cloneTree(mirror.tree);

	if (!('' in tree)) {
		return false;

	} else if (typeof tree['']!=='object') {
		return false;
	}

	var path;
	while ((path = findPath(tree)) !== false) {

		if (typeof tree[path] === 'boolean') {
			if (tree[path]) {
				opEmitter.emitOp('deleteFile', path);
			}

			if (path in mirror.pointtype) {
				if (mirror.pointtype[path][0] === MirrorTree.TYPE_SYMLINK) {
					opEmitter.emitOp('putSymlink', path, mirror.pointtype[path][1]);

				} else {
					opEmitter.emitOp('putDir', path, {});
				}

			} else {
				opEmitter.emitOp('putDir', path, {});
			}

		} else if (path!=='' && (path in mirror.stat)) {
			opEmitter.emitOp('dir', path, mirror.stat[path]);
		}

		delete tree[path];
	}

	return true;
};


/**
 * @param {object} [varname]
 * @return {string|false}
 */
var findPath = function(tree)
{
	var path = false;
	for (var key in tree) {
		if (path===false || key.length<path.length) {
			path = key;
		}
	}

	return path;
};
