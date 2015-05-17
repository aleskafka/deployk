
var stream = require('stream');


module.exports = LocalFile;


/**
 * @param {Local}
 * @param {string}
 * @param {Buffer|undefined}
 */
function LocalFile(local, path, content)
{
	/** @var {Local} */
	this.local = local;

	/** @var {string} */
	this.path = path;

	/** @var {Buffer|undefined} */
	this.content = content;
};


/**
 * @param {string}
 * @return {string}
 */
LocalFile.prototype.getRelativePath = function()
{
	return this.path;
};


/**
 * @param {string}
 * @return {string}
 */
LocalFile.prototype.getAbsolutePath = function()
{
	return this.local.join(this.path);
};


/**
 * @param {function}
 */
LocalFile.prototype.createReadStream = function(cb)
{
	if (this.content) {
		return cb(this.content);

	} else {
		return this.local.createReadStream(this.getAbsolutePath(), cb);
	}
};
