
var p = require('deployk-utils').path;
var PathRouter = require('../Router/PathRouter');

var Sync = require('./Sync');


module.exports = RuleList;


/**
 * @param {boolean=}
 * @param {boolean=}
 * @constructor
 */
function RuleList(localcheck, remotecheck)
{
	/** @var {boolean} */
	this.localcheck = localcheck||false;

	/** @var {boolean} */
	this.remotecheck = remotecheck||false;

	/** @var {Object.<string, PathRouter>} */
	this.router = {
		local: new PathRouter(),
		remote: new PathRouter()
	}

	/** @var {Array.<Sync>} */
	this.syncList = [];

	/** @var {Array.<string>} */
	this.keepDir = [];

	/** @var {Array.<Array.<string>>} */
	this.keepSymlink = [];
};


/**
 * @param {string}
 * @return {string}
 */
RuleList.prototype.localDir = function(path)
{
	return (path || '').replace(new RegExp('^/+'), '');
};


/**
 * @param {string}
 * @return {string}
 */
RuleList.prototype.remoteDir = function(path)
{
	return (path || '').replace(new RegExp('^/+'), '');
};


/**
 * @param {string}
 * @param {string}
 * @return {Sync}
 */
RuleList.prototype.addSync = function(syncFrom, syncTo)
{
	var sync, _sync;

	sync = new Sync(this.localDir(syncFrom), this.remoteDir(syncTo));

	if (this.remotecheck && (_sync = this.router.remote.findOne(sync.remoteDir))) {
		throw new Error('Remote path ' + sync.remoteDir + ' is already synced with ' + _sync.localDir + ' dir');

	} else if (this.localcheck && (_sync = this.router.local.findOne(sync.localDir))) {
		throw new Error('Local path ' + sync.localDir + ' is already synced with ' + _sync.remoteDir + ' dir');
	}

	this.syncList.push(sync);
	this.router.local.register(sync.localDir, sync);
	this.router.remote.register(sync.remoteDir, sync);

	return sync;
};


/**
 * @param {string}
 */
RuleList.prototype.addKeepDir = function(dest)
{
	dest = this.remoteDir(dest);
	this.keepDir.push(dest);
	this.router.remote.register(dest);
};


/**
 * @param {string}
 * @param {string}
 */
RuleList.prototype.addKeepSymlink = function(dest, source)
{
	dest = this.remoteDir(dest);
	source = this.remoteDir(source);

	this.keepSymlink.push([dest, source]);
	this.router.remote.register(dest);
};


/**
 * @param {Sync}
 * @param {string}
 * @return {boolean}
 */
RuleList.prototype.isLocalSyncedBy = function(sync, path)
{
	return this.router.local.findOne(p.join(sync.localDir, path))===sync;
};



/**
 * @param {Sync}
 * @param {string}
 * @return {boolean}
 */
RuleList.prototype.isRemoteSyncedBy = function(sync, path)
{
	return this.router.remote.findOne(p.join(sync.remoteDir, path))===sync;
};
