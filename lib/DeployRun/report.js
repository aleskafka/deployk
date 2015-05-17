
var chalk = require('chalk');
var dateformat = require('dateformat');


/**
 * @param {Stream}
 * @param {DeployProcess}
 * @param {boolean}
 */
module.exports = function(stream, deploy, verbose) {

	var ticked = 0;

	deploy.on('end', function() {
		stream.write(null);
	});

	deploy.on('abort', function(err) {
		stream.write('\n');
		stream.write('ABORTED');
		if (typeof err === 'string') stream.write(': ' + err);
		stream.write('\n\n');
	});

	deploy.on('success', function(err) {
		stream.write('\n');
		stream.write('OK');
		stream.write('\n\n');
	});

	deploy.on('step', function(step) {
		if (ticked) {
			ticked = 0;
			stream.write('\n');
		}

		stream.write('['+chalk.grey(dateformat(new Date(), 'HH:MM:ss'))+']\t');
		stream.write(step);
		stream.write('\n');
	});

	deploy.on('command', function(client, message) {
		if (verbose) {
			stream.write('\t\t[' + client + '] ' + message);
			stream.write('\n');

		} else if (ticked) {
			stream.write('.');
			if (++ticked%10 === 0) stream.write(ticked.toString());

		} else {
			stream.write('\t\t.');
			++ticked;
		}

	});
}
