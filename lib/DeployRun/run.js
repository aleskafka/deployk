

module.exports = function(deployInst, file) {
	var deploy;
	if (deploy = deployInst.createDeployProcess(file)) {

		deploy.on('end', function() {
			process.exit(1);
		});

		require('./report')(process.stdout, deploy, require('yargs').argv.verbose);
		deploy.run(require('./opts')());

	} else {
		console.log('ERROR: Could not load ' + file + ' config or its remote.');
		process.exit(1);
	}
}
