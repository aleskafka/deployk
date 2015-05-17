

module.exports = DeferEmitter;


/**
 * @param {object}
 * @constructor
 */
function DeferEmitter()
{
	/** @var {Array} */
	this.ops = [];

	/** @var {Array} */
	this.fileOps = [];
};


DeferEmitter.prototype.getLength = function()
{
	return this.ops.length + this.fileOps.length;
};


DeferEmitter.prototype.emitOp = require('./emitOp');


DeferEmitter.prototype.allOp = function()
{
	this.ops.push([].slice.call(arguments));
};


DeferEmitter.prototype.putFile = function()
{
	this.fileOps.push(['putFile'].concat([].slice.call(arguments)));
};


DeferEmitter.prototype.putContent = function()
{
	this.fileOps.push(['putContent'].concat([].slice.call(arguments)));
};


DeferEmitter.prototype.emit = function(opEmitter)
{
	this.ops.forEach(function(op) {
		opEmitter.emitOp.apply(opEmitter, op);
	});

	this.fileOps.forEach(function(op) {
		opEmitter.emitOp.apply(opEmitter, op);
	});
};
