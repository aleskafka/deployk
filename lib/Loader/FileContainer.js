

var path = require('deployk-utils').path;


module.exports = FileContainer;


function FileContainer()
{
	/** @var {object} */
	this.c = {};

	/** @var {int} */
	this.index = 0;
};


/**
 * @param {string}
 * @param {mixed}
 * @param {string}
 */
FileContainer.prototype.add = function(file, value, name)
{
	var c = this.init(file);

	if (typeof name==='undefined') {
		c[++this.index] = value;

	} else {
		c['_' + name] = value;
	}
};


/**
 * @param {string}
 * @param {mixed}
 */
FileContainer.prototype.set = function(file, value)
{
	var c = this.init(file);
	for (var key in c) {
		delete c[key];
	}

	c[++this.index] = value;
};


/**
 * @param {string}
 * @return {mixed}
 * @throws
 */
FileContainer.prototype.getFirst = function(file)
{
	var c = this.init(file);
	for (var key in c) {
		return c[key];
	}

	return false;
};


/**
 * @param {string}
 * @return {mixed}
 * @throws
 */
FileContainer.prototype.getLast = function(file)
{
	var c = this.init(file);
	var found = false;
	var value;
	for (var key in c) {
		found = true;
		value = c[key];
	}

	return found ? value : false;
};


/**
 * @param {string}
 * @return {boolean}
 */
FileContainer.prototype.has = function(file)
{
	var dirname  = path.dirname(file);
	var filename = path.basename(file);

	if (dirname in this.c) {
		if (filename in this.c[dirname]) {
			for (var key in this.c[dirname][filename]) {
				return true;
			}
		}
	}

	return false;
};


/**
 * @param {function}
 * @param {mixed}
 */
FileContainer.prototype.forEach = function(cb, scope)
{
	for (var dirname in this.c) {
		for (var filename in this.c[dirname]) {
			for (var key in this.c[dirname][filename]) {
				cb.call(scope, this.c[dirname][filename][key], path.join(dirname, filename));
			}
		}
	}
};


/**
 * @return {mixed}
 */
FileContainer.prototype.toArray = function()
{
	var ret = [];
	for (var dirname in this.c) {
		for (var filename in this.c[dirname]) {
			for (var key in this.c[dirname][filename]) {
				ret.push(this.c[dirname][filename][key]);
			}
		}
	}

	return ret;
};


/**
 * @param {string}
 * @param {string}
 * @return {Object.<string,mixed>|false}
 */
FileContainer.prototype.findByName = function(file, name)
{
	var paths, _path, i, key, files;

	name = '_' + name;
	paths = file.split('/');
	for (i=paths.length-1; i>=0; i--) {
		_path = paths.slice(0, i).join('/');

		if (_path in this.c) {
			files = this.c[_path];
			for (basename in files) {
				if (name in files[basename]) {
					return files[basename][name];
				}
			}
		}
	}

	return false;
};



/**
 * @param {string}
 * @return {Array.<mixed>}
 */
FileContainer.prototype.findByFile = function(file)
{
	var dirname = path.dirname(file);
	var filename = path.basename(file);

	if (this.c[dirname] && this.c[dirname][filename]) {
		return this.c[dirname][filename];
	}

	return [];
};


/**
 * @param {string}
 * @return {Array.<mixed>}
 */
FileContainer.prototype.findFiles = function(dir)
{
	var files = [];
	for (var dirname in this.c) {
		for (var filename in this.c[dirname]) {
			var file = path.join(dirname, filename);
			if (dirname===dir || dirname.indexOf(dir + '/')===0 || file===dir) {
				for (var key in this.c[dirname][filename]) {
					files.push(file);
				}
			}
		}
	}

	return files;
};


/**
 * @param {string}
 */
FileContainer.prototype.removeByFile = function(file)
{
	var dirname  = path.dirname(file);
	var filename = path.basename(file);

	if (dirname in this.c) {
		delete this.c[dirname][filename];
	}
};


/**
 * @param {string}
 * @return {object}
 */
FileContainer.prototype.init = function(file)
{
	var dirname  = path.dirname(file);
	var filename = path.basename(file);

	if (!(dirname in this.c)) {
		this.c[dirname] = {};
		this.c[dirname][filename] = {};

	} else if (!(filename in this.c[dirname])) {
		this.c[dirname][filename] = {};
	}

	return this.c[dirname][filename];
};
