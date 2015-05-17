
var fs = require('fs');
// var p = require('deployk-utils').path;
var p = require('path');
var glob = require('glob');
var Stat = require('deployk-utils').Stat;
var stream = require('stream');
var Buffer = require('buffer').Buffer;


module.exports = Local;


/**
 * @param {string}
 * @param {string}
 * @constructor
 */
function Local(file, relative)
{
	/** @var {string} */
	this.file = file;

	/** @var {string} */
	this.realdir = p.dirname(file);

	/** @var {string} */
	this.basedir = p.dirname(file);

	var matched;
	if (typeof relative === 'string') {
		this.basedir = p.resolve(this.basedir, relative);

	} else if (matched = file.match(/(^.+)\/\.[^\/]+(\/|$)/)) {
		this.basedir = matched[1];
	}
};


/**
 * @param {string}
 * @return {string}
 */
Local.prototype.relative = function(str)
{
	str = str.replace(new RegExp('^/+'), '');

	var base = this.basedir;
	if (str.length>1 && str[0]==='.' && str[1]==='/') {
		base = this.realdir;
	}

	return p.relative(this.basedir, p.resolve(base, str));
};


/**
 * @param {string}
 * @return {string}
 */
Local.prototype.resolve = function(str)
{
	return p.resolve(this.basedir, str);
};


/**
 * @param {string}
 * @return {string}
 */
Local.prototype.join = function(str)
{
	return p.join(this.basedir, str);
};


/**
 * @param {string}
 * @param {function}
 */
Local.prototype.stat = function(path, cb)
{
	fs.stat(p.join(this.basedir, path), function(err, stat) {
		cb(err, err ? undefined : Stat.fromFS(stat));
	});
};


/**
 * @param {string}
 * @param {function}
 */
Local.prototype.readdir = function(path, cb)
{
	var self = this;
	fs.readdir(p.join(this.basedir, path), function(err, files) {
		if (err) {
			cb(err);

		} else if (files.length===0) {
			cb(undefined, {});

		} else {
			var _files = {};
			var _count = files.length;
			files.forEach(function(file, i) {
				self.stat(p.join(path, file), function(err, stat) {
					delete files[i];

					if (stat) {
						_files[file] = stat;
					}

					if (--_count === 0) {
						cb(undefined, _files);
					}
				});
			});
		}
	});
};


/**
 * @param {Array.<String>}
 * @param {function}
 */
Local.prototype.glob = function(patterns, cb)
{
	var counter = patterns.length;
	var basedir = this.basedir;
	var result  = {};

	patterns.forEach(function(pattern) {
		var globObj = glob(pattern, {cwd: basedir, stat: true}, function(err, files) {
			files.forEach(function(file) {
				result[file] = globObj.statCache[p.join(basedir, file)];
			});

			if (--counter === 0) {
				cb && cb(result);
			}
		});
	});

	if (patterns.length===0) {
		cb && cb(result);
	}
};


/**
 * @param {string}
 * @param {function}
 */
Local.prototype.createReadStream = function(path, cb)
{
	fs.stat(path, function(err, stat) {
		if (err || stat.size===0) {
			cb(false);

		} else {
			cb(fs.createReadStream(path));
		}
	});
};
