

var util = require('util');
var fs = require('fs');
var path = require('path');
var glob = require('glob');
var minimatch = require('minimatch');
var EventEmitter = require('events').EventEmitter;


module.exports = FileLoader;


/**
 * @param {string}
 * @param {Array.<string>}
 * @param {boolean}
 * @constructor
 */
function FileLoader(basedir, patterns, watch)
{
	EventEmitter.call(this);

	/** @var {string} */
	this.basedir = basedir;

	/** @var {Array.<string>} */
	this.patterns = patterns;

	/** @var {boolean} */
	this.watch = watch || false;

	/** @var {object} */
	this.files = {};

	/** @var {object.<string, FSWatcher>} */
	this.watchers = {};

	/** @var {int} */
	this.loading = 0;
};
util.inherits(FileLoader, EventEmitter);


/**
 * @param {string}
 * @return {boolean}
 */
FileLoader.prototype.isLoaded = function(file)
{
	return file in this.files;
};


/**
 * @param {function}
 */
FileLoader.prototype.load = function(cb)
{
	var ignore = [
		'**/node_modules/**',
		'**/bower_components/**',
		'**/vendor/**',
		'**/public/**',
		'**/assets/**',
		'**/temp/**'
	];

	if (this.loading === 0) {
		this.loading  = this.patterns.length;

		var reload = [];
		var that   = this;
		this.patterns.forEach(function(pattern) {
			glob(pattern, {cwd: that.basedir, ignore: ignore}, function(err, files) {
				for (var i in files) {
					files[i] = path.resolve(that.basedir, files[i]);
				}

				reload = reload.concat(files);
				if (--that.loading === 0) {
					var loaded = {};
					for (var file in that.files) {
						loaded[file] = true;
					}

					that.reload(reload, loaded, function() {
						cb && cb();
					});
				}
			});
		});
	}
};


/**
 * @param {Array.<string>}
 * @param {object}
 * @param {function}
 * @private
 */
FileLoader.prototype.reload = function(files, loaded, cb)
{
	files.forEach(function(file) {
		delete loaded[file];
	});

	for (var file in loaded) {
		delete this.files[file];
		this.emit('unload', file);
	}

	var loading = files.length;
	files.forEach(function(file) {
		this.tryLoadFile(file, function() {
			if (--loading === 0) {
				cb && cb();
			}
		});
	}, this);
};


/**
 * @param {string}
 * @param {function}
 * @return {boolean}
 */
FileLoader.prototype.tryLoadFile = function(file, cb)
{
	for (var i in this.patterns) {
		if (minimatch(file, this.patterns[i])) {
			return this.loadFile(file, cb);
		}
	}

	cb && cb();
};


/**
 * @param {string}
 * @param {function}
 * @private
 */
FileLoader.prototype.loadFile = function(file, cb)
{
	var self = this;
	fs.stat(file, function(err, stat) {
		if (err) {
			delete self.files[file];
			self.emit('unload', file);

		} else if (stat.isFile() === false) {
			if (file in self.files) {
				delete self.files[file];
				self.emit('unload', file);
			}

		} else if (!(file in self.files) || self.files[file].size!==stat.size || self.files[file].mtime.getTime()!==stat.mtime.getTime()) {
			var event = self.files[file] ? 'reload' : 'load';
			self.files[file] = stat;
			self.watchFile(file);
			self.emit(event, file);
		}

		cb && cb();
	});
};


/**
 * @param {string}
 */
FileLoader.prototype.watchFile = function(file)
{
	if (this.watch) {
		var dirname = path.dirname(file);

		if (!(dirname in this.watchers)) {
			this.watchers[dirname] = fs.watch(dirname, this.onWatcher.bind(this, dirname));
		}
	}
};


/**
 * @param {string}
 */
FileLoader.prototype.onWatcher = function(dir)
{
	var that = this;
	fs.readdir(dir, function(err, files) {
		if (err) {
			that.watchers[dir].close();
			delete that.watchers[dir];
			return;
		}

		var loaded = {};
		for (var file in that.files) {
			if (dir===path.dirname(file)) {
				loaded[file] = true;
			}
		}

		for (var i in files) {
			files[i] = path.resolve(dir, files[i]);
		}

		that.reload(files, loaded);
	});
};
