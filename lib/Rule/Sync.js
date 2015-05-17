

var p = require('deployk-utils').path;
var minimatch = require('minimatch');

var Const = require('./Const');
var IgnoreFile = require('./IgnoreFile');
var IgnoreDir = require('./IgnoreDir');


module.exports = Sync;


/**
 * @param {string}
 * @param {string}
 * @constructor
 */
function Sync(localDir, remoteDir)
{
	/** @var {string} */
	this.localDir = localDir;

	/** @var {string} */
	this.remoteDir = remoteDir;

	/** @var {IgnoreFile} */
	this.ignoresFile = new IgnoreFile();

	/** @var {IgnoreDir} */
	this.ignoresDir = new IgnoreDir();
};


/** @const {int} */
for (var _const in Const) {
	Sync[_const] = Const[_const];
}


/**
 * @param {string}
 * @return {string|false}
 */
Sync.prototype.localMonitored = function(path)
{
	return this._isMonitored(path, this.localDir)
};


/**
 * @param {string}
 * @return {string|false}
 */
Sync.prototype.remoteMonitored = function(path)
{
	return this._isMonitored(path, this.remoteDir);
};


/**
 * @param {string}
 * @param {string}
 */
Sync.prototype._isMonitored = function(path, root)
{
	if (path===root) {
		return '.';

	} else if (root.indexOf(path.replace(new RegExp('/+$'), '') + '/')===0) {
		return '.';
	}

	path = p.relative(p.resolve('/', root), p.resolve('/', path));
	return (path[0]==='.' && path.length>1) ? false : (path || '.');
}


/**
 * @param {string}
 * @return {int}
 */
Sync.prototype.isPathIgnored = function(path)
{
	if (path==='' || path==='/' || path==='.') {
		return this.isDirIgnored(path);

	} else if (p.basename(path).indexOf('.')!==-1) {
		return this.isFileIgnored(path);

	} else {
		return this.isDirIgnored(path);
	}
};


/**
 * @param {string}
 * @return {int}
 */
Sync.prototype.isFileIgnored = function(path)
{
	if (path==='' || path==='/' || path==='.') {
		return Sync.MONITOR;
	}

	var ignored = this.isDirIgnored(p.dirname(path));
	if (ignored===Sync.IGNORE_REMOVE) {
		return Sync.IGNORE_REMOVE;
	}

	return Math.max(ignored || 0, this.ignoresFile.isIgnored(path) || 0);
};


/**
 * @param {string}
 * @return {int}
 */
Sync.prototype.isDirIgnored = function(path)
{
	if (path==='' || path==='/' || path==='.') {
		return Sync.MONITOR;
	}

	return this.ignoresDir.isIgnored(path) || Sync.MONITOR;
};


/**
 * @param {Array.<string>|string}
 * @param {boolean}
 * @return {Sync}
 */
Sync.prototype.ignoreFile = function(file, keep)
{
	var ignore = this.buildIgnore(Array.prototype.slice.call(arguments));
	this.ignoresFile.add(ignore[0], ignore[1]);
	return this;
}


/**
 * @param {Array.<string>|string}
 * @param {boolean}
 * @return {Sync}
 */
Sync.prototype.ignoreDir = function(dir, keep)
{
	var ignore = this.buildIgnore(Array.prototype.slice.call(arguments));
	this.ignoresDir.add(ignore[0], ignore[1]);
	return this;
}


/**
 * @param {Array}
 * @return {Array|false}
 * @private
 */
Sync.prototype.buildIgnore = function(args)
{
	var ignore, keep;

	if (args.length) {
		if (typeof args[0] === 'object') {
			ignore = args[0];
			keep   = args[1]!==false;

		} else {
			keep   = args.pop();
			ignore = args;

			if (typeof keep !== 'boolean') {
				ignore.push(keep);
				keep = true;
			}
		}

		return [ignore, keep];
	}

	return false;
};
