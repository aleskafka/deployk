

/**
 * @param {string}
 * @param {mixed..}
 * @method
 */
module.exports = function(op)
{
	if (typeof this === 'object') {
		if (typeof this[op] === 'function') {
			this[op].apply(this, Array.prototype.slice.call(arguments, 1));

		} else if (typeof this.allOp === 'function') {
			this.allOp.apply(this, arguments);

		} else if (typeof this.opEmitter === 'object') {
			this.opEmitter.emitOp.apply(this.opEmitter, arguments);
		}
	}
};