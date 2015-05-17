


module.exports = TestEmitter;


/**
 * @constructor
 */
function TestEmitter()
{
	/** @var {Array.<Array>} */
	this.changes = [];

	/** @var {Array.<string>} */
	this.ignored = [];
};


/**
 * @param {string..}
 */
TestEmitter.prototype.ignore = function()
{
	this.ignored = this.ignored.concat(Array.prototype.slice.call(arguments));
};


TestEmitter.prototype.emitOp = require('../../lib/Mirror-Diff/emitOp');


TestEmitter.prototype.allOp = function()
{
	if (this.ignored.indexOf(arguments[0])===-1) {
		this.changes.push(Array.prototype.slice.call(arguments));
	}
};


TestEmitter.prototype.file = function(dest, source, destStat, sourceStat)
{
	if (this.ignored.indexOf('file')===-1) {
		this.allOp('file', dest, source, typeof destStat === 'object', typeof sourceStat === 'object');
	}
};


TestEmitter.prototype.dir = function(path, stat)
{
	if (this.ignored.indexOf('dir')===-1) {
		this.allOp('dir', path, typeof stat === 'object');
	}
};
