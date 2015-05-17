
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var Buffer = require('buffer').Buffer;


module.exports = DeployContext;


/**
 * @param {Deploy}
 */
function DeployContext(deploy)
{
	EventEmitter.call(this);

	/** @var {Deploy} */
	this.deploy = deploy;

	/** @var {Object|boolean} */
	this.changes = true;

	// TODO: supply changes
	// this.changes = changes===true ? true : {
	// 	local: changes,
	// 	remote: {}
	// };

	/** @var {Array.<String>} */
	this._purged = [];

	/** @var {Array.<Object>} */
	this._async = [];

	/** @var {function} */
	this._whenDone = null;
};
util.inherits(DeployContext, EventEmitter);


/**
 * @return {Object|boolean}
 */
DeployContext.prototype.purgeChanges = function()
{
	var changes = this.changes===true ? true : {
		local: Object.keys(this.changes.local),
		remote: Object.keys(this.changes.remote)
	};

	this.changes = {
		local: {},
		remote: {}
	};

	return changes;
};


DeployContext.prototype.createContext = function()
{
	var self = this;

	return {
		abort: function(message) {
			self.deploy.abort(message);
		},
		purge: function(path) {
			if (path[0] === '/') {
				path = path.substr(1);

			} else if (path.substr(0, 2)==='./') {
				path = path.substr(2);
			}

			var done = false;
			self._purged.forEach(function(purged) {
				if (path===purged || path.indexOf(purged + '/')===0) {
					done = true;
				}
			});

			if (done===false) {
				if (self.changes!==true) {
					self.changes['remote'][path] = true;
				}

				self._purged.push(path);
				return self.deploy.purge(path, self.async('purge: '+ path));
			}
		},
		touch: function(path) {
			if (self.changes!==true) {
				self.changes['local'][path] = true;
				self.deploy.touch(path);
			}
		},
		wait: function(message) {
			return self.async(message, function(err, message) {
				if (err===false) {
					self.deploy.abort(message);
				}
			});
		},
		promise: function(message) {
			return self.async(message, function() {
				var promised = {};
				if (arguments[0]===false) {
					self.deploy.abort(arguments[1]);

				} else if (arguments.length===1) {
					if (typeof arguments[0]!=='object') {
						promised[arguments[0]] = true;

					} else {
						promised = arguments[0];
					}

				} else if (arguments.length===2) {
					promised[arguments[0]] = arguments[1];
				}

				Object.keys(promised).forEach(function(path) {
					if (typeof path==='string') {
						if (self.changes!==true) {
							self.changes['local'][path] = true;
						}

						if (typeof promised[path]==='string' || Buffer.isBuffer(promised[path])) {
							self.deploy.touchContent(path, promised[path], self.async('touchContent: ' + path));
						}
					}
				});
			});
		}
	};
};



DeployContext.prototype.createWaitContext = function()
{
	var self = this;
	return {
		abort: function(message) {
			self.deploy.abort(message);
		},
		wait: function(message) {
			return self.async(message, function(err, message) {
				if (err===false) {
					self.deploy.abort(message);
				}
			});
		}
	};
};


/**
 * @param {string}
 * @param {function}
 * @return {function}
 */
DeployContext.prototype.async = function(message, cb)
{
	var async, self = this;

	self._async.push(async = {done: false, message: message});
	this.emit('start', message, this.getDoneCount(), this.getTotalCount());

	return function() {
		cb && cb.apply(null, arguments);
		async.done = true;
		self.emit('end', message, self.getDoneCount(), self.getTotalCount());
		self.tryDone();
	}
}


/**
 * @param {function}
 */
DeployContext.prototype.whenDone = function(cb)
{
	this._whenDone = cb;
	this.tryDone();
};


/**
 * @return {int}
 */
DeployContext.prototype.getDoneCount = function()
{
	return this._async.filter(function(async) { return async.done; }).length;
};


/**
 * @return {int}
 */
DeployContext.prototype.getTotalCount = function()
{
	return this._async.length;
};


/**
 */
DeployContext.prototype.tryDone = function()
{
	if (this.getDoneCount()===this.getTotalCount()) {
		var cb = this._whenDone;
		this._whenDone = null;
		cb && cb();
	}
};


/**
 */
DeployContext.prototype.isFinished = function()
{
	if (this.changes===true) {
		return false;

	} else if (Object.keys(this.changes.local).length) {
		return false;

	} else if (Object.keys(this.changes.remote).length) {
		return false;

	} else if (this.getDoneCount()<this.getTotalCount()) {
		return false;
	}

	return true;
}
