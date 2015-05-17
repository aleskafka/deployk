
var Buffer = require('buffer').Buffer;

var Stat = require('deployk-utils').Stat;
var LocalFile = require('./LocalFile');
var Walk = require('./Walk');

module.exports = LocalWrapper;


/**
 * @param {Local}
 */
function LocalWrapper(local)
{
	/** @var {Local} */
	this.local = local;

	/** @var {Object} */
	this.touched = {};

	/** @var {Object} */
	this.touchedContent = {};
}


/**
 * @param {string}
 * @return {Walk}
 */
LocalWrapper.prototype.walk = function(path)
{
	return new Walk(this, path);
};


/**
 * @param {string}
 */
LocalWrapper.prototype.touch = function(path)
{
	this.touched[path] = true;
};


/**
 * @param {string}
 * @param {string|Buffer}
 */
LocalWrapper.prototype.touchContent = function(path, content)
{
	if (typeof content==='string') {
		this.touchedContent[path] = new Buffer(content, 'utf-8');

	} else if (Buffer.isBuffer(content)) {
		this.touchedContent[path] = content;

	} else {
		throw new Error('Invalid content for file ' + path + '. Expected string or Buffer.');
	}
};


/**
 * @param {string}
 * @return {boolean}
 */
LocalWrapper.prototype.isFileTouched = function(path)
{
	return this.touched[path]!==undefined || this.touchedContent[path]!==undefined;
};


/**
 * @param {string}
 * @return {boolean}
 */
LocalWrapper.prototype.isFileStream = function(path)
{
	return path in this.touchedContent;
};


/**
 * @param {string}
 * @return {LocalFile}
 */
LocalWrapper.prototype.createFile = function(path)
{
	return new LocalFile(this.local, path, this.touchedContent[path]);
};


/**
 * @param {string}
 * @param {function}
 */
LocalWrapper.prototype.stat = function(path, cb)
{
	var tempFiles = this.readdirTemp(path);

	if (tempFiles[path] && tempFiles[path].isFile()) {
		cb(undefined, tempFiles[path]);

	} else {
		this.local.stat(path, function(err, stat) {
			if (stat) {
				cb(undefined, stat);

			} else if (tempFiles[path]) {
				cb(undefined, tempFiles[path]);

			} else {
				cb(err);
			}
		});
	}
};


/**
 * @param {string}
 * @param {function}
 */
LocalWrapper.prototype.readdir = function(path, cb)
{
	var self = this;
	this.local.readdir(path, function(err, files) {
		var tempFiles;
		if (tempFiles = self.readdirTemp(path)) {
			err = undefined;

			files = files || {};
			Object.keys(tempFiles).forEach(function(file) {
				if (!(file in files) || tempFiles[file].isFile()) {
					files[file] = tempFiles[file];
				}
			});
		}

		cb(err, files);
	});
};


/**
 * @param {Array.<String>}
 * @param {function}
 */
LocalWrapper.prototype.glob = function(patterns, cb)
{
	return this.local.glob(patterns, cb);
};



/**
 * @param {string}
 * @return {boolean|Object}
 */
LocalWrapper.prototype.readdirTemp = function(path)
{
	var found = false;
	var files = {};

	Object.keys(this.touchedContent).forEach(function(file) {
		var _file = file;
		if (_file.indexOf(path + '/')===0) {
			_file = _file.substr(path.length+1);

			if (_file.indexOf('/')!==-1) {
				files[_file.substr(0, _file.indexOf('/'))] = new Stat('directory');

			} else {
				files[_file] = new Stat('file', new Date(), this.touchedContent[file].length, 777);
			}

			found = true;
		}
	}, this);

	return found ? files : false;
};
