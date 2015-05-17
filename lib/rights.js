

var p = require('path');


module.exports.bindDirRights = function(mixins, _default) {
	return function(path) {
		return rights(mixins, [path, p.basename(path)], _default);
	}
}


module.exports.bindFileRights = function(mixins, _default) {
	return function(path) {
		return rights(mixins, [p.basename(path), p.extname(path).replace(/^\.+/, '')], _default);
	}
}


/**
 * @param {string}
 * @param {string}
 * @param {Array.<string>}
 * @param {int}
 * @return {mixed}
 */
function rights(mixins, args, _default)
{
	for (var right, i=0; i<mixins.length; i++) {
		if (right = mixins[i].apply(null, args)) {
			return right;

		} else if (right!==undefined && right!==null) {
			return right;
		}
	}

	return _default;
}
