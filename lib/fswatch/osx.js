
var EventEmitter = require('events').EventEmitter;
var fsevents = require('fsevents');

module.exports = function(path) {
	var emitter = new EventEmitter();
	var _fsevents = fsevents(path);

	_fsevents.start();
	_fsevents.on('change', function(path, info) {
		/** info.type = file|symlink|directory */
		emitter.emit(info.type, path);
	});

	return emitter;
}
