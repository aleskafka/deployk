
var Const = require('./Const');


module.exports = Ignore;


/**
 * @param {function}
 * @constructor
 */
function Ignore(matchBuilder)
{
	/** @var {Array.<Array.<string,boolean>>} */
	this.ignore = [];

	/** @var {function} */
	this.matchBuilder = matchBuilder;
};


/**
 * @param {Array.<string>|string}
 * @param {boolean}
 * @return {Ignore}
 */
Ignore.prototype.add = function(ignore, keep)
{
	if (typeof ignore === 'object') {
		for (var i=0; i<ignore.length; i++) {
			this.add(ignore[i], keep);
		}

		return this;
	}

	this.ignore.push([this.matchBuilder(ignore), keep || false]);
	return this;
};


/**
 * @param {string}
 * @return {int|false}
 */
Ignore.prototype.isIgnored = function(path)
{
	var ignored = false;
	for (var i=0; i<this.ignore.length; i++) {
		if (this.ignore[i][0](path)) {
			if (!this.ignore[i][1]) {
				return Const.IGNORE_REMOVE;
			}

			ignored = Const.IGNORE_KEEP;
		}
	}

	return ignored;
};