

module.exports = function(tree)
{
	var ret = {};
	for (var dir in tree) {
		ret[dir] = tree[dir];
	}

	return ret;
};
