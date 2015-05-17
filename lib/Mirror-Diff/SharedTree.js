

module.exports = SharedTree;


/**
 * @constructor
 */
function SharedTree()
{
	/** @var {Object.<string,boolean>} */
	this.shared = {};
};


/**
 * @param {string}
 * @return {self}
 */
SharedTree.prototype.add = function(path)
{
	path = path.replace(new RegExp('^/+'), '');
	path = path.split('/');

	for (var i=0; i<path.length-1; i++) {
		this.shared[path.slice(0, i+1).join('/')] = true;
	}

	return this;
};


/**
 * @param {string}
 * @return {boolean}
 */
SharedTree.prototype.isShared = function(path)
{
	path = path.replace(new RegExp('^/+'), '');
	return path in this.shared;
};
