'use strict';

var mixins = require('./mixins');
var rights = require('./rights');

var Watch = require('./rule/Watch');
var RuleList = require('./rule/RuleList');


module.exports = Config;


function Config()
{

	/** @var {RuleList} */
	this.ruleList = new RuleList(false, true);

	/** @var {Array.<Watch>} */
	this.watchList = [];

	/** @var {Array.<Watch>} */
	this.globList = [];

	/** @var {Object.<string,Array>} */
	this.eventList = {
		'before': [],
		'beforeend': []
	};

	/** @var {Object} */
	this.changes = {};

	mixins(Config, this, ['fileRights', 'dirRights']);

	/**
	 * @param {string}
	 * @return {int}
	 */
	this.dirRights = rights.bindDirRights(this.mixined['dirRights'], 755);
	this.fileRights = rights.bindFileRights(this.mixined['fileRights'], 755);
};


/**
 * @param {string}
 */
Config.prototype.routed = function(path)
{
	this.changes[path] = true;
};


/**
 * @param {string}
 * @param {string|undefined}
 * @return {Sync}
 */
Config.prototype.sync = function(localDir, remoteDir)
{
	return this.ruleList.addSync(localDir, remoteDir===undefined ? localDir : remoteDir);
};


/**
 * @param {string|Array.<string>}
 * @return {Watch}
 */
Config.prototype.watch = function(patterns)
{
	var watch = new Watch(typeof patterns === 'object' ? patterns : Array.prototype.slice.call(arguments));
	this.watchList.push(watch);
	return watch;
};


/**
 * @param {string|Array.<string>}
 * @return {Watch}
 */
Config.prototype.glob = function(patterns)
{
	var glob = new Watch(typeof patterns === 'object' ? patterns : Array.prototype.slice.call(arguments));
	this.globList.push(glob);
	return glob;
}


/**
 * @param {string}
 */
Config.prototype.keepDir = function(remoteDir)
{
	this.ruleList.addKeepDir(remoteDir);
};


/**
 * @param {string}
 * @param {string}
 */
Config.prototype.keepSymlink = function(remoteDir, remoteSource)
{
	this.ruleList.addKeepSymlink(remoteDir, remoteSource);
};


/**
 * @param {string}
 * @param {function}
 */
Config.addEventList = function(event)
{
	return function(cb) {
		if (event in this.eventList) {
			this.eventList[event].push(cb);
		}
	}
};


Config.prototype.before = Config.addEventList('before');
Config.prototype.beforeend = Config.addEventList('beforeend');
