

var p = require('deployk-utils').path;
var util = require('util');
var Mirror = require('./Mirror');


module.exports = MirrorTree;


/**
 * @param {Client}
 * @constructor
 */
function MirrorTree(client)
{
	Mirror.call(this, client);

	/** @var {Object} */
	this._startpoint = {};

	/** @var {Object.<string,mixed>} */
	this.pointtype = {};
};
util.inherits(MirrorTree, Mirror);


/** @const {int} */
MirrorTree.TYPE_PATH = 1;
MirrorTree.TYPE_DIR = 2;
MirrorTree.TYPE_SYMLINK = 3;


/**
 * @param {string}
 * @param {int}
 * @param {mixed=}
 */
MirrorTree.prototype.prepare = function(path, type, value)
{
	type = type || MirrorTree.TYPE_PATH;

	path = path.replace(new RegExp('/+$'), '');
	path = path.replace(new RegExp('^/+'), '');

	if (path!=='') {
		startpoint = type !== MirrorTree.TYPE_PATH ? path + '/' : path;
		this._startpoint[startpoint] = true;
		this.pointtype[path] = [type, value];
	}
};


/**
 * @param {string}
 */
MirrorTree.prototype.purge = function(path)
{
	[this.tree, this.stat].forEach(function(purge) {
		Object.keys(purge).forEach(function(_path) {
			if (path==='.' || path==='' || path==='/' || path===_path || _path.indexOf(path + '/') === 0) {
				purge[_path] = false;
			}
		}, this);
	}, this);
};


/**
 * @protected
 * @override
 */
MirrorTree.prototype.runMirror = function()
{
	this.startpoint = {};
	Object.keys(this._startpoint).forEach(function(startpoint) {
		this.startpoint[startpoint] = true;
	}, this);

	this.walkDir('');
	this.done();
};


/**
 * @param {string}
 * @private
 */
MirrorTree.prototype.walkDir = function(path)
{
	this.counter++;

	this.tree[path] = {};

	var that = this;
	this.client.readdir(path, function(err, files) {
		if (err) {
			that.tree[path] = false;
		}

		var filesKeys, startpoint, startparts;

		filesKeys = files ? Object.keys(files) : [];
		for (startpoint in that.startpoint) {

			if (path==='') {
				startparts = startpoint.split('/');

			} else if (startpoint.indexOf(path + '/')===0) {
				startparts = startpoint.substr(path.length+1).split('/');

			} else {
				continue;
			}

			if (startparts.length === 1) {
				delete that.startpoint[startpoint];

			} else {
				var filepath = p.join(path, startparts[0]);

				if (filesKeys.indexOf(startparts[0])!==-1) {

					var stat = files[startparts[0]];
					that.stat[filepath] = stat;

					if (stat.isDirectory()) {
						that.walkDir(filepath);

					} else if (stat.isSymbolicLink()) {
						that.walkMissing(filepath, {});

					} else {
						that.walkMissing(filepath, true);
					}

				} else {
					that.walkMissing(filepath, false);
				}
			}
		}

		that.counter--;
		that.done();
	});
};


/**
 * @param {string}
 * @param {mixed}
 * @private
 */
MirrorTree.prototype.walkMissing = function(path, value)
{
	for (var startpoint in this.startpoint) {
		if (startpoint.indexOf(path + '/')===0) {
			this.tree[path] = value || false;

			var startparts = startpoint.substr(path.length+1).split('/');
			if (startparts.length === 1) {
				delete this.startpoint[startpoint];

			} else {
				this.walkMissing(p.join(path, startparts[0]));
			}
		}
	}
};
