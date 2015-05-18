
var p = require('deployk-utils').path;
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var Walk = require('./Walk');


module.exports = RemoteWrapper;


/**
 * @param {function}
 * @param {string}
 * @param {int}
 * @constructor
 */
function RemoteWrapper(remote, basedir, parallel)
{
	EventEmitter.call(this);

	/** @var {function} */
	this.remote = remote;

	/** @var {Object} */
	this.client = new Array(Math.max(1, parallel||0));

	/** @var {Array.<boolean>} */
	this.busy = Array.apply(null, new Array(Math.max(1, parallel))).map(function(){ return false });

	/** @var {string} */
	this.basedir = basedir;

	/** @var {string} */
	this.deploydir = p.join(this.basedir, '.deploy/.revision-'+Date.now());

	/** @var {int} */
	this._uid = 0;

	/** @var {Object.<string,string>} */
	this._uidPath = {};

	/** @var {function} */
	this._whenDone;

	/** @var {function|boolean} */
	this._commited = false;

	/** @var {Array} */
	this._delayed = [];

	/** @var {Array} */
	this._pending = [];
};
util.inherits(RemoteWrapper, EventEmitter);


/**
 * @param {function}
 */
RemoteWrapper.prototype.connect = function(cb)
{
	this.connectClient(0, cb);
};


/**
 * @param {int}
 * @param {function}
 * @private
 */
RemoteWrapper.prototype.connectClient = function(i, cb)
{
	this.client[i] = false;

	var self = this;
	this.remote(function(remote) {
		self.client[i] = remote;
		cb();
	});
}


/**
 * @param {boolean}
 * @param {function}
 */
RemoteWrapper.prototype.setup = function(setup, cb)
{
	var tree = [];

	if (setup) {
		var basedir = this.basedir.split('/');
		var dir = [''];

		for (var i=0; i<basedir.length; i++) {
			if (basedir[i]) {
				dir.push(basedir[i]);
				tree.push([dir.join('/'), 755]);
			}
		}
	}

	tree.push([p.join(this.basedir, '.deploy'), 777])
	tree.push([this.deploydir, 777]);

	this.setupTree(tree, cb);
};


/**
 * @param {Array}
 * @param {function}
 */
RemoteWrapper.prototype.setupTree = function(tree, cb)
{
	if (tree.length===0) {
		cb();

	} else {
		var dir = tree.shift();

		var self = this;
		this.client[0].putDir(dir[0], dir[1], function(err) {
			if (err && tree.length===0) {
				cb(true);

			} else {
				self.setupTree(tree, cb);
			}
		});
	}
};


/**
 * @param {string}
 * @return {Walk}
 */
RemoteWrapper.prototype.walk = function(path)
{
	return new Walk(this.client[0], p.join(this.basedir, path));
};


/**
 * @return {int}
 */
RemoteWrapper.prototype.getDelayedLength = function()
{
	return this._delayed.length;
};


/**
 * @param {function}
 */
RemoteWrapper.prototype.whenDone = function(cb)
{
	this._whenDone = cb;
	this.tryDone();
};


/**
 * @return {boolean}
 */
RemoteWrapper.prototype.isDone = function()
{
	if (this._pending.length) {
		return false;
	}

	for (var i=0; i<this.busy.length; i++) {
		if (this.busy[i]) {
			return false;
		}
	}

	return true;
};


RemoteWrapper.prototype.tryDone = function()
{
	if (this.isDone() && this._whenDone) {
		var cb = this._whenDone;
		this._whenDone = null;
		cb();
	}
};


/**
 * @param {function}
 */
RemoteWrapper.prototype.commit = function(cb)
{
	this._commited = cb;
	this.tryCommit();
};


RemoteWrapper.prototype.emitOp = require('../Mirror-Diff/emitOp');


RemoteWrapper.prototype.allOp = function()
{
	// Missing operation?
};


RemoteWrapper.prototype.chmod = function(path, chmod)
{
	this.delayCommand('chmod('+chmod+'): '+path,
		'chmod', p.join(this.basedir, path), chmod
	);
};


RemoteWrapper.prototype.putDir = function(path, chmod)
{
	this.sendCommand('putDir('+chmod+'): '+path,
		'putDir', this.uidPath(path), chmod
	);
};


RemoteWrapper.prototype.putSymlink = function(dest, source)
{
	this.sendCommand('putSymlink: '+dest,
		'putSymlink', this.uidPath(dest), p.resolve(this.basedir, source)
	);
};


RemoteWrapper.prototype.putFile = function(dest, source, chmod)
{
	this.sendCommand('putFile('+chmod+'): '+dest,
		'putFile', this.uidPath(dest), source, chmod
	);
};


RemoteWrapper.prototype.putContent = function(dest, source, chmod)
{
	this.sendCommand('putContent('+chmod+'): '+dest,
		'putContent', this.uidPath(dest), source, chmod
	);
};


RemoteWrapper.prototype.deleteDir = function(path)
{
	this.delayCommand('renameFrom: '+path,
		'rename', p.join(this.basedir, path), this.createUidPath()
	);
};


RemoteWrapper.prototype.deleteFile = function(path)
{
	this.delayCommand('renameFrom: '+path,
		'rename', p.join(this.basedir, path), this.createUidPath()
	);
};


/**
 * @param {string}
 * @return {string}
 * @private
 */
RemoteWrapper.prototype.uidPath = function(path)
{
	if (path in this._uidPath) {
		return this._uidPath[path];

	} else if (p.dirname(path) in this._uidPath) {
		return this._uidPath[path] = p.join(this._uidPath[p.dirname(path)], p.basename(path));
	}

	this._uidPath[path] = this.createUidPath();
	this.delayCommand('renameTo: '+path,
		'rename', this._uidPath[path], p.join(this.basedir, path)
	);

	return this._uidPath[path];
};


/**
 * @return {string}
 * @private
 */
RemoteWrapper.prototype.createUidPath = function()
{
	this._uid++;
	return p.join(this.deploydir, this._uid.toString());
};


/**
 * @private
 */
RemoteWrapper.prototype.tryCommit = function()
{
	var cb, commands;

	if (this._commited!==false && this.isDone()) {
		if (this._delayed.length===0) {
			cb = this._commited;
			this._commited = false;
			cb && cb();

		} else {
			commands = this._delayed;
			this._delayed = [];
			commands.forEach(function(command) {
				this.sendCommand.apply(this, command);
			}, this);
		}
	}
}


/**
 * @private
 */
RemoteWrapper.prototype.delayCommand = function()
{
	this._delayed.push([].slice.call(arguments, 0));
};


/**
 * @private
 */
RemoteWrapper.prototype.sendCommand = function()
{
	this._pending.push([].slice.call(arguments, 0));
	this.tryCommand();
};


/**
 * @private
 */
RemoteWrapper.prototype.tryCommand = function()
{
	if (this._pending.length===0) {
		return false;
	}

	if (this._pending[0][1]!=='putFile' && this._pending[0][1]!=='putContent') {
		if (this.busy[0]===false) {
			this.executeCommand(0, this._pending.shift());
		}

	} else {
		for (var i=this.busy.length-1; i>=0; i--) {
			if (this.busy[i]===false) {
				if (this.client[i]) {
					this.executeCommand(i, this._pending.shift());

				} else if (this.client[i]===undefined) {
					this.connectClient(i, this.tryCommand.bind(this));
					return false;
				}
			}
		}
	}

	return false;
};


/**
 * @param {int}
 * @param {Array}
 * @private
 */
RemoteWrapper.prototype.executeCommand = function(client, command)
{
	this.busy[client] = true;
	this.emit('command', client, command[0]);
	this.tryCommand();

	var self = this;
	setTimeout(function() {
		self.client[client][command[1]].apply(self.client[client], command.slice(2).concat([function(err) {
			if (err) throw new Error(err);

			self.busy[client] = false;
			self.tryCommand();
			self.tryDone();
			self.tryCommit();
		}]));
	}, 10);
};
