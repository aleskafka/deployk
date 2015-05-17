

module.exports = PathRouter;


function PathRouter()
{
	/** @var {object.<string, mixed>} */
	this.paths = {};

	/** @var {string|false} */
	this.speedup = false;
};


/**
 * @param {Array.<string>|string}
 * @param {mixed}
 */
PathRouter.prototype.register = function(path, item)
{
	if (typeof path === 'object') {
		for (var i=0; i<path.length; i++) {
			this.register(path[i], item);
		}

	} else {
		path = path.replace(new RegExp('/+$'), '');
		path = path || '/';

		if (!(path in this.paths)) {
			this.paths[path] = [];
		}

		this.paths[path].push(item);
		this.speedup = false;
	}
};


/**
 * @param {string}
 */
PathRouter.prototype.route = function(path)
{
	if (this.speedup && path.indexOf(this.speedup)===0) {
		return;
	}

	var found = this.find(path);

	if (found.length === 0) {
		this.speedup = this.findSpeedUp(path);
		return;
	}

	found.forEach(function(item) {
		item.routed(path);
	})
};


/**
 * @param {string}
 * @return {Array.<mixed>}
 */
PathRouter.prototype.find = function(path)
{
	var found = [], paths, subpath;
	paths = path.split('/');

	for (var i=paths.length; i>0; i--) {
		subpath = paths.slice(0, i).join('/') || '/';

		if (subpath in this.paths) {
			this.mergeFound(this.paths[subpath], found);
		}
	}

	return found;
};


/**
 * @param {string}
 * @return {mixed|false}
 */
PathRouter.prototype.findPath = function(path)
{
	path = path.replace(new RegExp('/+$'), '');
	path = path || '/';

	if (path in this.paths) {
		return this.paths[path];
	}

	return false;
};


/**
 * @param {string}
 * @return {mixed|false}
 */
PathRouter.prototype.findOne = function(path)
{
	var paths, subpath;
	paths = path.split('/');

	for (var i=paths.length; i>0; i--) {
		subpath = paths.slice(0, i).join('/') || '/';

		if (subpath in this.paths) {
			return this.paths[subpath][0];
		}
	}

	return false;
};


/**
 * @param {string}
 * @return {Array.<Sync>}
 */
PathRouter.prototype.findChildren = function(path)
{
	path = path.replace(new RegExp('/+$'), '');
	path = path + '/';

	var children = [];
	for (var _path in this.paths) {
		if (_path.indexOf(path)===0) {
			children = children.concat(this.paths[_path]);
		}
	}

	return children;
};


/**
 * @param {string}
 * @return {string}
 * @private
 */
PathRouter.prototype.findSpeedUp = function(path)
{
	var paths, subpath, found, i, key;

	paths = path.split('/');
	for (i=0; i<paths.length; i++) {
		subpath = paths.slice(0, i).join('/');
		subpath = subpath.replace(new RegExp('/+$'), '');
		subpath = subpath + '/';

		found = false;
		for (key in this.paths) {
			if (key===subpath) {
				return '';

			} else if (key.indexOf(subpath) !== -1) {
				found = true;
				break;
			}
		}

		if (found===false) {
			return subpath;
		}
	}

	return '';
};


/**
 * @param {Array.<mixed>}
 * @param {Array.<mixed>}
 * @private
 */
PathRouter.prototype.mergeFound = function(pending, found)
{
	for (var i=0; i<pending.length; i++) {
		item = pending[i];

		var exists = false;
		for (var j=0; j<found.length; j++) {
			if (item === found[j]) {
				exists = true;
				break;
			}
		}

		if (exists===false) {
			found.push(item);
		}
	}
};
