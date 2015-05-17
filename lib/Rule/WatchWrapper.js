


module.exports = WatchWrapper;


/**
 * @param {Array.<Watch>}
 * @param {Object}
 * @constructor
 */
function WatchWrapper(watchList, context)
{
	/** @var {Array.<WatchInstance>} */
	this.watchList = [];

	watchList.forEach(function(watch) {
		this.watchList.push(watch.create(context));
	}, this);
};


/**
 * @return {Array.<String>}
 */
WatchWrapper.prototype.buildPatterns = function()
{
	var patterns = [];
	this.watchList.forEach(function(watch) {
		watch.patterns.forEach(function(minimatch) {
			patterns = patterns.concat(minimatch.globSet);
		});
	});

	return patterns;
};


/**
 * @param {string}
 * @param {string}
 */
WatchWrapper.prototype.track = function(file)
{
	this.watchList.forEach(function(watch) {
		watch.track(file);
	});
};
