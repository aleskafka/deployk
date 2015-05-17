

module.exports = Stat;


/**
 * @param {string}
 * @param {Date}
 * @param {int}
 * @param {int}
 * @constructor
 */
function Stat(type, mtime, size, mode)
{
	/** @var {string} */
	this.type = type;

	/** @var {Date} */
	this.mtime = mtime;

	/** @var {int} */
	this.size = size;

	/** @var {int} */
	this.mode = mode;
}


Stat.prototype.isFile = function()
{
	return this.type==='file';
};


Stat.prototype.isDirectory = function()
{
	return this.type==='directory';
};

Stat.prototype.isSymbolicLink = function()
{
	return this.type==='symlink';
};
