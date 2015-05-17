

var util = require('util');
var Dirmatch = require('deployk-utils').dirmatch.Dirmatch;
var Ignore = require('./Ignore');


module.exports = IgnoreDir;


/**
 * @constructor
 */
function IgnoreDir()
{
	Ignore.call(this, function(pattern) {
		return Dirmatch.prototype.match.bind(new Dirmatch(pattern));
	});
};
util.inherits(IgnoreDir, Ignore);
