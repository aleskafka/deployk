#!/usr/bin/env node

'use strict';

var path = require('path');

var v8flags = require('v8flags').fetch();
var flaggedRespawn = require('flagged-respawn');
var resolve = require('resolve');

var chalk = require('chalk');
var dateformat = require('dateformat');

var report = require('../lib/DeployRun/report');

var args = require('yargs').
	alias('c', 'config').
	default('watch', false).
	argv;

var basedir = process.cwd();

flaggedRespawn(v8flags, process.argv, function(ready, child) {
	if (ready) {
		run();

	} else {
		var flags = process.argv.filter(function (flag) { return v8flags.indexOf(flag) !== -1; })
		console.log('Node flags detected:', chalk.magenta(flags.join(', ')));
	}
});

var module, modulePath, deployInst;
function run()
{
	try {
		modulePath = resolve.sync('deployk', {basedir: basedir});

	} catch (e) {
		console.log(chalk.red('Local deployk module not found.'));
		console.log('Run: npm install deployk');
		process.exit(1);
	}

	try {
		module = require(modulePath);
		deployInst = new module(process.cwd());
		logEvents(deployInst);

	} catch (e) {
		console.log(chalk.red('Could not load instance of deployk module.'));
		process.exit(1);
	}

	process.nextTick(function () {
		deployInst.run(args.watch, function() {
			var port;
			if (args.config) {
				require('../lib/DeployRun/run')(deployInst, path.resolve(basedir, args.config));

			} else if (port = parseInt(args.port, 10)) {
				require('../lib/DeployRun/restful')(deployInst, port);
			}
		});
	});
}


function logEvents(inst)
{
	inst.on('load', function(file) {
		log('Loaded configuration file', chalk.cyan(file));
	});

	inst.on('reload', function(file) {
		log('Reloaded configuration file', file);
	});

	inst.on('unload', function(file) {
		log('Unloaded configuration file', chalk.magenta(file));
	});

	inst.on('loadError', function(file, err) {
		log('Failed loading configuration file', chalk.red(file));
		log(chalk.red(err.toString()));
	});

	inst.on('require', function(module) {
		log('Loaded external module', chalk.cyan(module));
	});

	inst.on('requireFail', function(module) {
		log(chalk.red('Failed requiring module', module));
	});
};


function log()
{
	var args = Array.prototype.slice.call(arguments);
	args.unshift('['+chalk.grey(dateformat(new Date(), 'HH:MM:ss'))+']');

	console.log.apply(console, args);
};
