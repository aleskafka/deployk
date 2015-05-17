
var util = require('util');
var UntreeEmitter = require('./UntreeEmitter');
var SharedTree = require('./SharedTree');


module.exports = SharedEmitter;


/**
 * @param {object}
 * @param {SharedTree}
 * @constructor
 */
function SharedEmitter(opEmitter, sharedTree)
{
	UntreeEmitter.call(this, this);

	/** @var {object} */
	this._opEmitter = opEmitter;

	/** @var {SharedTree} */
	this.sharedTree = sharedTree || (new SharedTree);
};
util.inherits(SharedEmitter, UntreeEmitter);


SharedEmitter.prototype.emitOp = require('./emitOp');



/**
 * @param {string}
 * @param {object}
 */
SharedEmitter.prototype.putDir = function(dest, tree)
{
	if (this.sharedTree.isShared(dest)) {
		if (Object.keys(tree[dest]).length) {
			UntreeEmitter.prototype.putDir.call(this, dest, tree);
		}

	} else {
		this._opEmitter.emitOp('putDir', dest, tree);
	}
};


/**
 * @param {string}
 * @param {object}
 */
SharedEmitter.prototype.deleteDir = function(dest, tree)
{
	if (this.sharedTree.isShared(dest)) {
		if (Object.keys(tree[dest]).length) {
			UntreeEmitter.prototype.putDir.call(this, dest, tree);
		}

	} else {
		this._opEmitter.emitOp('deleteDir', dest, tree);
	}
};


/**
 * @param {string}
 * @param {string}
 * @param {mixed..}
 */
SharedEmitter.prototype.allOp = function(op, dest)
{
	if (!this.sharedTree.isShared(dest)) {
		this._opEmitter.emitOp.apply(this._opEmitter, arguments);
	}
};
