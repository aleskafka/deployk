

var util = require('util');
var EventEmitter = require('events').EventEmitter;

var FileLoader = require('./FileLoader');


module.exports = DeployLoader;


/**
 * @param {Object|null|false}
 * @param {string}
 * @param {string}
 * @param {Array.<string>}
 * @constructor
 */
function DeployLoader(watcher, basedir, configfile, patterns)
{
	patterns = patterns || [];
	if (configfile) {
		patterns.unshift('**/' + configfile + '.*');
	}

	FileLoader.call(this, basedir, patterns, watcher!==false);

	/** @var {object} */
	this.pending = [];

	/** @var {object} */
	this.delayed = null;

	if (watcher) {
		watcher.on('file', this.onFile.bind(this));
		watcher.on('directory', this.onDirectory.bind(this));
	}
};
util.inherits(DeployLoader, FileLoader);


/**
 * @param {string}
 * @private
 */
DeployLoader.prototype.onFile = function(file)
{
	if (this.isLoaded(file)) {
		this.loadFile(file);
		return;
	}

	if (this.delayed) {
		clearTimeout(this.delayed);

		if (this.pending.length===0 || this.pending.length>5) {
			this.delayed = setTimeout(this.delayedLoad.bind(this, false), 1000);
			return;
		}
	}

	this.pending.push(file);
	this.delayed = setTimeout(this.delayedLoad.bind(this, true), 1000);
};


/**
 * @param {string}
 * @private
 */
DeployLoader.prototype.onDirectory = function(dir)
{
	if (this.delayed) {
		clearTimeout(this.delayed);
		this.pending = [];
	}

	this.delayed = setTimeout(this.delayedLoad.bind(this, false), 1000);
};


/**
 * @param {boolean}
 */
DeployLoader.prototype.delayedLoad = function(fromPending)
{
	if (fromPending) {
		for (var i in this.pending)
			this.tryLoadFile(this.pending[i]);

	} else {
		this.load();
	}

	this.pending = [];
	this.delayed = null;
};
