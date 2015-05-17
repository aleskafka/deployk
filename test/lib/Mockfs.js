
var Stat = require('./Stat');


module.exports = Mockfs;


function Mockfs(tree)
{
	/** @var {object} */
	this.tree = tree;
};


/**
 * @param {string}
 * @param {callback}
 */
Mockfs.prototype.readdir = function(path, callback)
{
	var that = this;
	process.nextTick(function() {
		var found = that.findPath(path);

		if (found===false) {
			callback(new Error('Path ' + path + ' not found.'), undefined);

		} else if (typeof found !== 'object') {
			callback(new Error('ENOENT, readdir' + path), undefined);

		} else {
			var files = {};
			Object.keys(found).forEach(function(file) {
				files[file] = that.buildStat(found[file]);
			});

			callback(undefined, files);
		}
	});
};


/**
 * @param {string}
 * @param {callback}
 */
Mockfs.prototype.stat = function(path, callback)
{
	var that = this;
	process.nextTick(function() {
		var found = that.findPath(path);

		if (found===false) {
			callback(new Error('Path ' + path + ' not found.'), undefined);

		} else {
			callback(undefined, that.buildStat(found));
		}
	});
};


/**
 * @param {string}
 * @return {mixed}
 */
Mockfs.prototype.findPath = function(path)
{
	paths = path.split('/');

	var tree = this.tree;
	while (paths.length) {
		_path = paths.shift();

		if (_path==='') {
			continue;

		} else if (_path in tree) {
			tree = tree[_path];

		} else {
			return false;
		}
	}

	return tree;
};


/**
 * @param {Object|int}
 * @return {Stat}
 * @private
 */
Mockfs.prototype.buildStat = function(_stat)
{
	if (typeof _stat !== 'object') {
		var stat = new Stat('file', new Date(1417388400000), _stat, 0777);
		stat.size  = _stat;

		return stat;

	} else {
		return new Stat('directory', new Date(1417388400000), 0, 0777);
	}
};
