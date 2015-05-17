'use strict';

var util = require('util');
var path  = require('deployk-utils').path;
var extend = require('config-extend');
var resolve = require('resolve');
var interpret = require('interpret');
var EventEmitter = require('events').EventEmitter;

var fswatch = require('./fswatch');
var DeployLoader = require('./Loader/DeployLoader');
var FileContainer = require('./Loader/FileContainer');
var PathRouter = require('./Router/PathRouter');

var Local = require('./Local');
var Config = require('./Config');
var RuleList = require('./rule/RuleList');

var LocalWrapper = require('./DeployProcess/LocalWrapper');
var RemoteWrapper = require('./DeployProcess/RemoteWrapper');
var DeployProcess = require('./DeployProcess/DeployProcess');


module.exports = Deploy;

var _inst, file = process.mainModule.filename;
var inst = function() {
	return _inst = _inst || new Deploy(process.cwd());
}

var instCall = function(method, args) {
	return inst()[method].apply(inst(), [file].concat([].slice.call(args)));
}

module.exports.local = function() {
	return instCall('local', arguments);
}

module.exports.remote = function() {
	return instCall('remote', arguments);
}

module.exports.connect = function() {
	process.nextTick(function() {
		require('./DeployRun/run')(inst(), file);
	});

	return instCall('connect', arguments);
}


/**
 * @param {string}
 * @param {object}
 * @constructor
 */
function Deploy(basedir, opts)
{
	EventEmitter.call(this);

	if (typeof this === 'undefined') {
		throw new Error('Deploy class cannot be called as function, you probably wanted to call .connect() instead.');
	}

	/** @var {string} */
	this.basedir = basedir || process.cwd();

	/** @var {object} */
	this.opts = extend({
		configfile: 'deployfile',
		patterns: ['**/.deploy/*.*']
	}, opts);

	/** @var {FileContainer} */
	this.remoteList = new FileContainer();

	/** @var {Object.<string,FileContainer>} */
	this.byFile = {
		configList: new FileContainer(),
		localList: new FileContainer(),
		remoteList: new FileContainer()
	};

	/** @var {PathRouter} */
	this.router = new PathRouter();

	/** @var {object} */
	this.loadedModules = {};

};
util.inherits(Deploy, EventEmitter);


/**
 * @param {boolean}
 * @param {function}
 */
Deploy.prototype.run = function(watch, cb)
{
	var _fswatch;

	if (watch) {
		if (_fswatch = fswatch(this.basedir)) {
			_fswatch.on('file', this.onFile.bind(this));
			_fswatch.on('directory', this.onDirectory.bind(this));
		}
	}

	/** @var {DeployLoader} */
	this.loader = new DeployLoader(
		watch ? (_fswatch||null) : false,
		this.basedir,
		this.opts.configfile,
		this.opts.patterns
	);

	this.loader.on('load', this.loadFile.bind(this, 'load'));
	this.loader.on('reload', this.loadFile.bind(this, 'reload'));
	this.loader.on('unload', this.unloadFile.bind(this));

	this.loader.load(cb);
};


/**
 * @param {string}
 * @param {string}
 * @return {void}
 */
Deploy.prototype.local = function(file, path)
{
	if (this.byFile.configList.has(file)) {
		throw new Error('Local has to be called before establision of first config.');
	}

	this.byFile.localList.set(file, new Local(file, path));
};


/**
 * @param {string}
 * @param {string}
 * @param {function}
 * @param {string}
 */
Deploy.prototype.remote = function(file, name, client, path)
{
	this.remoteList.add(file, {
		client: client,
		path: path || ''
	}, name);
};


/**
 * @param {string}
 * @param {mixed..}
 * @return {Config}
 */
Deploy.prototype.connect = function(file)
{
	if (this.byFile.configList.has(file)) {
		throw new Error('Only one config per file is allowed.');
	}

	if ((typeof arguments[1] === 'string') || (typeof arguments[1] === 'function')) {
		if (this.byFile.localList.has(file)===false) {
			this.byFile.localList.set(file, new Local(file));
		}

		var config;
		this.byFile.configList.add(file, config = this.createConfig(file));
		this.byFile.remoteList.add(file, [arguments[1], arguments[2], parseInt(arguments[3], 10)]);

		return config;
	}

	throw new Error('Unknown connect option passed. Expected remote name or instance of Remote.');
};


/**
 * @param {string}
 * @return {Config}
 */
Deploy.prototype.createConfig = function(file)
{
	var config, local;

	local = this.byFile.localList.getLast(file);

	config = new Config();
	config.ruleList.localDir = function(dir) {
		dir = local.relative(RuleList.prototype.localDir(dir));
		return process.platform === 'win32' ? dir.replace(/\\\\/g, '/') : dir;
	}

	return config;
};


/**
 * @param {string}
 * @param {DeployProcess|false}
 */
Deploy.prototype.createDeployProcess = function(file)
{
	var config, remoteWrapper;
	if (config = this.byFile.configList.getFirst(file)) {
		if (remoteWrapper = this.createRemoteWrapper(file)) {
			return new DeployProcess(config, new LocalWrapper(this.byFile.localList.getFirst(file)), remoteWrapper);
		}
	}

	return false;
};


/**
 * @param {string}
 * @return {RemoteWrapper|false}
 */
Deploy.prototype.createRemoteWrapper = function(file)
{
	var remote;
	if (remote = this.byFile.remoteList.getFirst(file)) {
		if (typeof remote[0] === 'string') {
			var remoteInst;
			if (remoteInst = this.remoteList.findByName(file, remote[0])) {
				return new RemoteWrapper(remoteInst, path.join(remoteInst.path, remote[1]||''), remote[2]);
			}

		} else if (typeof remote[0] === 'function') {
			return new RemoteWrapper(remote[0], remote[1]||'', remote[2]);
		}
	}

	return false;
};


/**
 * @param {string}
 * @return {void}
 */
Deploy.prototype.onFile = function(file)
{
	this.router.route(file);
};


/**
 * @param {string}
 * @return {void}
 */
Deploy.prototype.onDirectory = function(directory)
{
	this.router.route(directory);
};


/**
 * @param {string}
 * @param {string}
 */
Deploy.prototype.loadFile = function(event, file)
{
	var rfile = path.relative(process.cwd(), file);

	this._unloadFile(file);

	var deployInst;
	try {
		deployInst = require(resolve.sync('deploy', {basedir: path.dirname(file)}));
		deployInst.local = Deploy.prototype.local.bind(this, file);
		deployInst.remote = Deploy.prototype.remote.bind(this, file);
		deployInst.connect = Deploy.prototype.connect.bind(this, file);

	} catch (e) {
		this.emit('loadError', rfile, 'Local deploy package not found.');
	}

	if (deployInst && this.loadFileModule(file)) {
		var cwd = process.cwd();

		try {
			delete require.cache[file];
			process.chdir(path.dirname(file));

			require(file);
			process.chdir(cwd);
			this.emit(event, rfile);

		} catch (e) {
			process.chdir(cwd);
			this._unloadFile(file);
			this.emit('loadError', rfile, e);
		}
	}

	this.buildRouter();
};


/**
 * @param {string}
 */
Deploy.prototype.unloadFile = function(file)
{
	this._unloadFile(file);
	this.emit('unload', path.relative(process.cwd(), file));
	this.buildRouter();
};


/**
 * @param {string}
 */
Deploy.prototype._unloadFile = function(file)
{
	this.remoteList.removeByFile(file);
	this.byFile.configList.removeByFile(file);
	this.byFile.remoteList.removeByFile(file);
	this.byFile.localList.removeByFile(file);
};


/**
 */
Deploy.prototype.buildRouter = function()
{
	this.router = new PathRouter();

	this.byFile.configList.forEach(function(config, file) {
		var local;

		local = this.byFile.localList.getFirst(file);
		config.ruleList.syncList.forEach(function(sync) {
			this.router.register(local.resolve(sync.localDir), config);
		}, this);
	}, this);
};


/**
 * @param {string}
 * @return {boolean}
 * @private
 */
Deploy.prototype.loadFileModule = function(file)
{
	var module;
	var extension = /(\.[^\/]*)?$/.exec(file)[0];

	if (extension in interpret.jsVariants) {
		module = interpret.jsVariants[extension];

	} else {
		return false;
	}

	if (module===null) {
		return true;

	} else if (module in this.loadedModules) {
		return this.loadedModules[module];
	}

	try {
		require(resolve.sync(module, {basedir: process.cwd()}));
		this.emit('require', module);
		return this.loadedModules[module] = true;

	} catch (e) {
		this.emit('requireFail', module);
		return this.loadedModules[module] = false;
	}
};
