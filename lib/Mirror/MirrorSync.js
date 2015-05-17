

var p = require('deployk-utils').path;
var util = require('util');
var Mirror = require('./Mirror');
var Sync = require('../Rule/Sync');


module.exports = MirrorSync;


/**
 * @param {MirrorClient}
 * @param {Sync}
 * @param {RuleList=}
 * @constructor
 */
function MirrorSync(client, sync, ruleList)
{
	Mirror.call(this, client);

	/** @var {Sync} */
	this.sync = sync;

	/** @var {RuleList=} */
	this.ruleList = ruleList;

	/** @var {Object.<string,true>} */
	this.fixed = {};
};
util.inherits(MirrorSync, Mirror);


/**
 * @param {string}
 * @param {boolean=}
 */
MirrorSync.prototype.prepare = function(path, purge)
{
	if (path==='.') {
		path = '';
	}

	if (this.mirroredPath(path)) {
		this.startpoint[path] = true;

		if (purge) {
			this.purge(path);
		}
	}
};


/**
 * @param {string}
 */
MirrorSync.prototype.purge = function(path)
{
	return this._purge([this.tree, this.walked, this.fixed], path);
};


/**
 * @param {string}
 */
MirrorSync.prototype.purgeTree = function(path)
{
	return this._purge([this.tree, this.fixed], path);
};


/**
 * @param {string}
 */
MirrorSync.prototype._purge = function(arrays, path)
{
	arrays.forEach(function(purge) {
		Object.keys(purge).forEach(function(_path) {
			if (path==='.' || path==='' || path==='/' || path===_path || _path.indexOf(path + '/') === 0) {
				delete purge[_path];
			}
		}, this);
	}, this);
};


/**
 * @private
 */
MirrorSync.prototype.runMirror = function()
{
	var startpoint;

	while ((startpoint = this.findStartpoint()) !== false) {
		delete this.startpoint[startpoint];

		if (this.walked[startpoint] === undefined) {
			this.counter++;

			this.runStartpoint(startpoint);
		}
	}

	this.done();
};


/**
 * @param {string}
 * @private
 */
MirrorSync.prototype.runStartpoint = function(startpoint)
{
	var self = this;
	this.client.stat(startpoint, function(err, stat) {
		if (stat && stat.isDirectory()) {
			self.stat[startpoint] = stat;
			self.mirrorDirectory(startpoint);

		} else if (stat && stat.isFile()) {
			self.stat[startpoint] = stat;
			self.tree[startpoint] = true;
			self.walked[startpoint] = true;
		}

		self.counter--;
		self.done();
	});
};


/**
 * @param {string}
 * @param {boolean}
 * @return {string|false}
 */
MirrorSync.prototype.mirroredPath = function(path, file)
{
	if (file) {
		if (this.sync.isFileIgnored(path)!==Sync.MONITOR) {
			return false;
		}

	} else if (this.sync.isDirIgnored(path)!==Sync.MONITOR) {
		return false;

	} else if (this.ruleList) {
		return this.ruleList.isRemoteSyncedBy(this.sync, path);
	}

	return true;
};


/**
 * @return {string|false}
 * @private
 */
MirrorSync.prototype.findStartpoint = function()
{
	var startpoint = false;
	for (var key in this.startpoint) {
		if (startpoint===false || key.length<startpoint.length) {
			startpoint = key;
		}
	}

	return startpoint;
};


/**
 * @param {string}
 * @param {boolean}
 * @private
 */
MirrorSync.prototype.mirrorDirectory = function(path)
{
	if (path in this.walked) {
		return;
	}

	this.walked[path] = true;
	this.counter++;

	var that = this;

	this.client.readdir(path, function(err, files) {
		if (err) {
			that.counter--;
			that.done();
			return;
		}

		that.tree[path] = {};

		for (var file in files) {
			var filepath = p.join(path, file);
			var stat = files[file];

			if (err) {

			} else if (that.ruleList && that.ruleList.isRemoteSyncedBy(that.sync, filepath)===false) {

			} else if (stat.isFile()) {

				var status = that.sync.isFileIgnored(filepath, true);
				if (status===Sync.IGNORE_KEEP) {
					that.fixedPath(path);

				} else if (status===Sync.MONITOR) {
					that.stat[filepath]   = stat;
					that.tree[path][file] = true;
					that.tree[filepath]   = true;

				} else if (status===Sync.IGNORE_REMOVE) {
					that.stat[filepath]   = stat;
					that.tree[path][file] = false;
					that.tree[filepath]   = false;
				}

			} else if (stat.isDirectory()) {
				var status = that.sync.isDirIgnored(filepath, true);
				if (status===Sync.IGNORE_KEEP) {
					that.fixedPath(path);

				} else if (status===Sync.MONITOR) {
					that.stat[filepath]   = stat;
					that.tree[path][file] = true;
					that.mirrorDirectory(filepath);

				} else if (status===Sync.IGNORE_REMOVE) {
					that.stat[filepath]   = stat;
					that.tree[path][file] = false;
					that.mirrorDirectory(filepath);
				}

			} else {
				that.fixedPath(path);
			}
		}

		that.counter--;
		that.done();
	});
};


/**
 * @param {string}
 * @private
 */
MirrorSync.prototype.fixedPath = function(path)
{
	while (!(path in this.fixed) && path!=='.') {
		this.fixed[path] = true;
		path = p.dirname(path);
	}
};
