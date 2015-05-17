

module.exports = function(path)
{
	try {
		if (process.platform==='darwin') {
			return require('./fswatch/osx')(path);
		}

	} catch (e) {
		return null;
	}
};
