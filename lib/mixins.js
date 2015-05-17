

/**
 * @param {Object}
 * @param {Array.<String>}
 */
module.exports = function(_class, _instance, mixined) {

	_instance.mixined = {};
	(mixined||[]).forEach(function(name) {
		_instance.mixined[name] = [];
	});

	_instance.mixins = function(mixins)
	{
		if (typeof arguments[0] === 'string') {
			mixins = [{}];
			mixins[0][arguments[0]] = arguments[1];

		} else {
			mixins = Array.prototype.slice.call(arguments);
		}

		mixins.forEach(function(mixin) {
			Object.keys(mixin).forEach(function(name) {
				if (name in _instance.mixined) {
					_instance.mixined[name].push(mixin[name]);

				} else if (_class.prototype[name] !== undefined) {
					throw new Error("Mixin '" + name + "' could not override function.");

				} else if (_instance[name] && typeof _instance[name] !== 'function') {
					throw new Error("Mixin '" + name + "' could not override internal property.");

				} else {
					_instance[name] = mixin[name];
				}
			}, _instance);
		}, _instance);

		return _instance;
	};
};
