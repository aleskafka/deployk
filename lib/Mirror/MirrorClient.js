

var p = require('deployk-utils').path;


module.exports = MirrorClient;


/**
 * @param {Client}
 * @param {string}
 * @constructor
 */
function MirrorClient(client, path)
{
	/** @var {Client} */
	this.client = client;

	/** @var {string} */
	this.path = path;
};


/**
 * @param {string}
 * @param {function}
 */
MirrorClient.prototype.readdir = function(path, cb)
{
	path = p.join(this.path, path);

	var that = this;
	this.client.readdir(path, function(err, files) {
		cb.apply(null, [err, files]);
	});
};


/**
 * @param {string}
 * @param {function}
 */
MirrorClient.prototype.stat = function(path, cb)
{
	path = p.join(this.path, path);

	var that = this;
	this.client.stat(path, function(err, stat) {
		cb.apply(null, [err, stat]);
	});
};
