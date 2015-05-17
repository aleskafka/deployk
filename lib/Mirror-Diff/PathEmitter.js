
var p = require('deployk-utils').path;


module.exports = PathEmitter;


/**
 * @param {object}
 * @param {string}
 * @param {string}
 * @constructor
 */
function PathEmitter(opEmitter, dest, source)
{
	/** @var {object} */
	this.opEmitter = opEmitter;

	/** @var {string} */
	this.dest = dest||'';

	/** @var {string} */
	this.source = source||'';
};


PathEmitter.prototype.emitOp = require('./emitOp');


PathEmitter.prototype.allOp = function()
{
	var args = Array.prototype.slice.call(arguments);
	args[1] = p.join(this.dest, args[1]);

	this.opEmitter.emitOp.apply(this.opEmitter, args);
}


PathEmitter.prototype.file = function(dest, source, destStat, sourceStat)
{
	this.opEmitter.emitOp('file', p.join(this.dest, dest), p.join(this.source, source), destStat, sourceStat);
};


PathEmitter.prototype.putFile = function(dest, source)
{
	this.opEmitter.emitOp('putFile', p.join(this.dest, dest), p.join(this.source, source));
};


PathEmitter.prototype.putSymlink = function(dest, source)
{
	// TODO: source or dest?
	// this.opEmitter.emitOp('putSymlink', p.join(this.dest, dest), p.join(this.source, source));
	this.opEmitter.emitOp('putSymlink', p.join(this.dest, dest), p.join(this.dest, source));
};


PathEmitter.prototype.putDir = function(path, tree)
{
	var _tree = {};
	Object.keys(tree).forEach(function(source) {
		_tree[p.join(this.dest, source)] = tree[source]===true ? p.join(this.source, source) : tree[source];
	}, this);

	this.opEmitter.emitOp('putDir', p.join(this.dest, path), _tree);
};
