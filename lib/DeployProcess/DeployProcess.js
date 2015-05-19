

var p = require('deployk-utils').path;
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var async = require('async');
var extend = require('config-extend');

var DeployEmitter = require('./Emitter');
var DeployContext = require('./Context');

var WatchWrapper = require('./../Rule/WatchWrapper');

var MirrorTree = require('../Mirror/MirrorTree');
var MirrorSync = require('../Mirror/MirrorSync');

var diffMirrorTree = require('../Mirror-Diff/diffMirrorTree');
var diffMirrorSync = require('../Mirror-Diff/diffMirrorSync');
var DeferEmitter = require('../Mirror-Diff/DeferEmitter');
var PathEmitter = require('../Mirror-Diff/PathEmitter');
var UntreeEmitter = require('../Mirror-Diff/UntreeEmitter');
var SharedEmitter = require('../Mirror-Diff/SharedEmitter');
var SharedTree = require('../Mirror-Diff/SharedTree');


module.exports = DeployProcess;


/**
 * @param {Config}
 * @param {LocalWrapper}
 * @param {RemoteWrapper}
 * @constructor
 */
function DeployProcess(config, local, remote)
{
	var self = this;
	EventEmitter.call(this);

	/** @var {Config} */
	this.config = config;

	/** @var {LocalWrapper} */
	this.local = local;

	/** @var {RemoteWrapper} */
	this.remote = remote;

	this.remote.on('command', function(client, message) {
		self.emit('command', client, message);
	});

	/** @var {boolean} */
	this.aborted = false;

	/** @var {SharedTree} */
	this.sharedTree = new SharedTree();

	/** @var {MirrorTree} */
	this.mirrorTree;

	/** @var {Array.<Object>} */
	this.mirrorSyncList = [];

	/** @var {DeployContext} */
	this.context = new DeployContext(this);

	this.context.on('start', function(message, done, total) {
		self.emit('step', 'async: ' + done + '/' + total + (message ? '; Start: ' + message : ''));
	});

	this.context.on('end', function(message, done, total) {
		self.emit('step', 'async: ' + done + '/' + total + (message ? '; Done: ' + message : ''));
	});

	/** @var {WatchWrapper} */
	this.watchWrapper = new WatchWrapper(config.watchList, this.context.createContext());

	/** @var {WatchWrapper} */
	this.globWrapper = new WatchWrapper(config.globList, this.context.createContext());
};
util.inherits(DeployProcess, EventEmitter);


DeployProcess.prototype.abort = function(message)
{
	this.aborted = message ? message : true;
};


DeployProcess.prototype.should = function(run)
{
	var self = this;
	return function(cb) {
		if (self.aborted) {
			cb(true);

		} else {
			run(cb);
		}
	};
};


DeployProcess.prototype.run = function(opts)
{
	opts = extend({
		dry: false,
		setup: false
	}, opts);

	var self = this;
	async.series([
		this.should(function(cb) {
			self.emit('step', '1/9:\tConnect to remote server.');
			self.remote.connect(function(err) {
				if (err) self.abort('Could not connect to remote server.');
				cb();
			})
		}),
		this.should(function(cb) {
			self.mirrorTree = new MirrorTree(self.remote.walk('/'));
			self.createMirrorTree();
			self.createMirrorSyncList();
			cb();
		}),
		this.should(function(cb) {
			self.emit('step', '2/9:\tMirror project tree.');
			self.mirrorTree.run(cb);
		}),
		this.should(function(cb) {
			self.emit('step', '3/9:\tbefore events.')
			self.config.eventList['before'].forEach(function(event) {
				event.apply(self.context.createContext());
			});

			self.context.whenDone(function() {
				cb();
			});
		}),
		this.should(function(cb) {
			self.emit('step', '4/9:\tGlob events');
			self.local.glob(self.globWrapper.buildPatterns(), function(files) {

				self.emit('step', '5/9:\tSynchronization loop.');
				Object.keys(files).forEach(function(file) {
					self.globWrapper.track(file);
				});

				cb();
			});
		}),
		this.should(function(cb) {
			self.runLoop(cb);
		}),
		this.should(function(cb) {
			if (opts.dry) {
				self.emit('step', '6/9:\tSkip setup.');
				cb();

			} else {
				if (opts.setup) {
					self.emit('step', '6/9:\tSetup project and deploy dirs.');

				} else {
					self.emit('step', '6/9:\tSetup deploy dirs.');
				}

				self.remote.setup(opts.setup, function(err) {
					if (err && opts.setup) {
						self.abort('Could not setup project and deploy dir.');

					} else if (err) {
						self.abort('Could not setup deploy dir. Project dir is probably missing, call setup to create ' + self.remote.basedir);
					}

					cb();
				});
			}
		}),
		this.should(function(cb) {
			var emitter, defer = new DeferEmitter();
			self.emit('step', '7/9:\tCalculate diffs between local and remote.');

			emitter = defer;
			emitter = new DeployEmitter(emitter, self.local, self.config.dirRights, self.config.fileRights);
			diffMirrorTree(self.mirrorTree, emitter);

			self.mirrorSyncList.forEach(function(sync) {
				emitter = defer;
				emitter = new DeployEmitter(emitter, self.local, self.config.dirRights, self.config.fileRights);
				emitter = new SharedEmitter(emitter, self.sharedTree);
				emitter = new PathEmitter(emitter, sync.remoteDir, sync.localDir);

				diffMirrorSync(sync.from, sync.to, emitter);
			});

			self.emit('step', ' - \t\tPending: ' + defer.getLength() + ' commands.');

			if (opts.dry) {
				self.abort('Dry mode. Commands not executed.');
				cb();

			} else {
				defer.emit(self.remote);
				self.remote.whenDone(function() {
					cb();
				});
			}
		}),
		this.should(function(cb) {
			self.emit('step', '8/9:\tCommit changes into production.');
			self.emit('step', ' - \t\tPending: ' + self.remote.getDelayedLength() + ' commands.');
			self.remote.commit(function() {
				cb();
			});
		}),
		this.should(function(cb) {
			self.emit('step', '9/9:\tbeforeend events.');
			self.config.eventList['beforeend'].forEach(function(event) {
				event.apply(self.context.createWaitContext());
			});

			self.context.whenDone(function() {
				cb();
			});
		}),
	], function(err) {
		if (err===undefined) {
			self.emit('success');

		} else {
			self.emit('abort', self.aborted);
		}

		self.emit('end');
	})
};


/**
 * @param {function}
 */
DeployProcess.prototype.runLoop = function(cb)
{
	var self = this;
	async.doWhilst(
		function(cb) {
			self.context.whenDone(function() {
				var defer = new DeferEmitter();
				var changes = self.context.purgeChanges();
				var syncList = [].concat(self.mirrorSyncList);

				async.whilst(
					function() { return self.aborted===false && syncList.length>0; },
					function(cb) {
						var sync = syncList.shift();
						if (changes===true) {
							sync.from.prepare('', true);
							sync.to.prepare('');

						} else {
							changes.local.forEach(function(local) {
								if (local = sync.sync.localMonitored(local)) {
									sync.from.prepare(local, true);
									sync.to.prepare(local);
								}
							});

							changes.remote.forEach(function(remote) {
								if (remote = sync.sync.remoteMonitored(remote)) {
									sync.from.prepare(remote, true);
									sync.to.prepare(remote);
								}
							});
						}

						self.emit('step', ' - \t\tSync ' + sync.localDir + ' -> ' + sync.remoteDir);

						async.parallel([
							sync.from.run.bind(sync.from),
							sync.to.run.bind(sync.to)
						], function(err) {
					 		var emitter = defer;
					 		emitter = new DeployEmitter(emitter, self.local, self.config.dirRights, self.config.fileRights);
					 		emitter = new PathEmitter(emitter, sync.remoteDir, sync.localDir);
					 		emitter = new UntreeEmitter(emitter);
					 		diffMirrorSync(sync.from, sync.to, emitter);

							cb();
						});

					},
					function() {
						self.emit('step', ' - \t\tPending: ' + defer.getLength() + ' commands');

						defer.emit({
							emitOp: function(op, dest, source) {
								if (op==='putFile' || op==='putContent') {
									self.watchWrapper.track(source.getRelativePath());
								}
							}
				 		});

						cb();
					}
				);
			});
		},
		function() { return self.aborted===false && !self.context.isFinished(); },
		cb
	);
};


/**
 * @param {string}
 * @param {function}
 */
DeployProcess.prototype.purge = function(path, cb)
{
	var self = this;

	async.parallel([
		function(cb) {
			self.mirrorTree.purge(path);
			var syncList = [].concat(self.mirrorSyncList);
			async.whilst(
				function() { return syncList.length>0; },
				function(cb) {

					var sync = syncList.shift();
					var remote;
					if (remote = sync.sync.remoteMonitored(path)) {
						sync.to.prepare(remote);

						sync.to.run(function() {
							sync.to.purgeTree(remote);
							cb();
						})

					} else {
						cb();
					}
				},
				cb
			);
		},
		function(cb) {
			self.remote.walk('').stat(path, function(err, stat) {
				if (!err) {
					if (stat.isDirectory()) {
						self.remote.deleteDir(path);

					} else if (stat.isFile()) {
						self.remote.deleteFile(path);
					}
				}

				cb();
			});
		}
	], cb);
}


/**
 * @param {string}
 */
DeployProcess.prototype.touch = function(path)
{
	this.local.touch(path);
};


/**
 * @param {string}
 * @param {string|Buffer}
 * @param {function}
 */
DeployProcess.prototype.touchContent = function(path, content, cb)
{
	var self = this;
	this.local.walk('').stat(p.dirname(path), function(err, stat) {
		if (stat && stat.isDirectory()) {
			self.mirrorSyncList.forEach(function(sync) {
				var local;
				if (local = sync.sync.localMonitored(path)) {
					sync.from.prepare(local, true);
					sync.to.prepare(local);
				}
			});

		} else {
			self.mirrorSyncList.forEach(function(sync) {
				if (sync.sync.localMonitored(path)) {
					sync.from.prepare('', true);
					sync.to.prepare('');
				}
			});
		}

		self.local.touchContent(path, content);
		cb();
	});
};


/**
 * @param {function}
 */
DeployProcess.prototype.createMirrorTree = function()
{
	this.config.ruleList.syncList.forEach(function(sync) {
		this.mirrorTree.prepare(sync.remoteDir);
		this.sharedTree.add(sync.remoteDir);
	}, this);

	this.config.ruleList.keepDir.forEach(function(dir) {
		this.mirrorTree.prepare(dir, MirrorTree.TYPE_DIR);
		this.sharedTree.add(dir);
	}, this);

	this.config.ruleList.keepSymlink.forEach(function(symlink) {
		this.mirrorTree.prepare(symlink[0], MirrorTree.TYPE_SYMLINK, symlink[1]);
		this.sharedTree.add(symlink[0]);
	}, this);
};


DeployProcess.prototype.createMirrorSyncList = function()
{
	this.config.ruleList.syncList.forEach(function(sync) {
		this.mirrorSyncList.push({
			sync: sync,
			remoteDir: sync.remoteDir,
			localDir: sync.localDir,
			from: new MirrorSync(this.local.walk(sync.localDir), sync, this.config.ruleList),
			to: new MirrorSync(this.remote.walk(sync.remoteDir), sync, this.config.ruleList)
		});
	}, this);
};
