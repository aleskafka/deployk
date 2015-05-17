

var p = require('deployk-utils').path;


module.exports = Walk;


/**
 * @param {Client}
 * @param {string}
 */
function Walk(client, basedir)
{
	/** @var {Client} */
	this.client = client;

	/** @var {string} */
	this.basedir = basedir;
};


/**
 * @param {string}
 * @param {function}
 */
Walk.prototype.readdir = function(path, cb)
{
	if (path==='/') {
		this.client.readdir(this.basedir||'/');

	} else {
		this.client.readdir(p.join(this.basedir, path), cb);
	}
};


/**
 * @param {string}
 * @param {function}
 */
Walk.prototype.stat = function(path, cb)
{
	if (path==='/') {
		this.client.stat(this.basedir||'/', cb);

	} else {
		this.client.stat(p.join(this.basedir, path), cb);
	}
};
