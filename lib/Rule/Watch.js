
var util = require('util');
var Minimatch = require('minimatch').Minimatch;


module.exports = Watch;


/**
 * @param {Array.<string>|string..}
 * @constructor
 */
function Watch(patterns)
{
	/** @var {Array.<string>} */
	this.patterns = typeof patterns === 'object' ? patterns : Array.prototype.slice.call(arguments);

	/** @var {Array.<Array>} */
	this.listeners = [];
};


/**
 * @param {function}
 */
Watch.prototype.once = function(handler)
{
	this.listeners.push(['once', handler]);
	return this;
};


/**
 * @param {function}
 */
Watch.prototype.on = function(handler)
{
	this.listeners.push(['on', handler]);
	return this;
};


/**
 * @param {Object}
 * @return {WatchInstance}
 */
Watch.prototype.create = function(context)
{
	return new WatchInstance(this.patterns, this.listeners.slice(0), context);
};


/**
 * @param {Array.<string>}
 * @param {Array}
 * @param {Object}
 * @constructor
 */
function WatchInstance(patterns, listeners, context)
{
	/** @var {Array.<Minimatch>} */
	this.patterns = patterns.map(function(pattern) {
		if (typeof pattern === 'string') {
			return new Minimatch(pattern);
		}

		return false;
	}).filter(function(value) { return !!value; });

	/** @var {Array} */
	this.listeners = listeners || [];

	/** @var {Object} */
	this.context = context;

	/** @var {Object.<string,bool>} */
	this.tracked = {};
};


/**
 * @param {string}
 * @return {boolean}
 */
WatchInstance.prototype.track = function(file)
{
	if (file in this.tracked) {
		return true;
	}

	for (var i=0; i<this.patterns.length; i++) {
		if (this.patterns[i].match(file)) {
			this.tracked[file] = true;

			var _new = [];
			this.listeners.forEach(function(val) {
				val[1].call(this.context, file);

				if (val[0]==='on') {
					_new.push(val);
				}
			}, this);

			this.listeners = _new;
			return true;
		}
	}

	return false;
};
