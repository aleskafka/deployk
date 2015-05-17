

var MirrorTree = require('./MirrorTree');


module.exports = mirrorRuleTree;


/**
 * @param {Client}
 * @param {RuleList}
 * @param {function}
 * @return {MirrorTree}
 */
function mirrorRuleTree(client, ruleList, cb)
{
	var mirror = new MirrorTree(client);

	ruleList.syncList.forEach(function(sync) {
		mirror.prepare(sync.remoteDir, MirrorTree.TYPE_PATH);
	});

	ruleList.keepDir.forEach(function(dir) {
		mirror.prepare(dir, MirrorTree.TYPE_DIR);
	})

	ruleList.keepSymlink.forEach(function(symlink) {
		mirror.prepare(symlink[0], MirrorTree.TYPE_SYMLINK, symlink[1]);
	});

	mirror.run(cb);
	return mirror;
};