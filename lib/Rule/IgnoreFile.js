
var util = require('util');
var Minimatch = require('minimatch').Minimatch;
var Ignore = require('./Ignore');


module.exports = IgnoreFile;


/**
 * @constructor
 */
function IgnoreFile()
{
	Ignore.call(this, function(pattern) {
		return Minimatch.prototype.match.bind(new Minimatch(pattern));
	});
};
util.inherits(IgnoreFile, Ignore);