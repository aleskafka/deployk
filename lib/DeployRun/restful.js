
var path = require('path');
var express = require('express');

module.exports = function(deploy, port) {
	var restful = express();

	restful.post('/list', function(req, res) {
		var body = '';
		req.on('data', function(chunk) {
			body += chunk.toString();
		});

		req.on('end', function() {
			res.setHeader('Content-Type', 'application/json');

			var response = {};
			deploy.byFile.configList.findFiles(body).forEach(function(file) {
				var cmd, commands = [];

				commands.push(['deploy', 'cmd', [process.mainModule.filename, "--config", file], deploy.basedir]);
				commands.push(['setup + deploy', 'cmd', [process.mainModule.filename, "--setup", "--config", file], deploy.basedir]);

				response[file] = [
					path.basename(file),
					'./' + path.relative(body, file),
					commands
				];
			});

			res.write(JSON.stringify(response));
			res.end();
		});
	});

	restful.listen(port);
}
