
var args = require('yargs').
	default('setup', false).
	default('dry', false).
	argv;

module.exports = function() {
	return {
		dry: args.dry,
		setup: args.setup
	};
}
