

module.exports = Mirror;


/**
 * @param {Client}
 * @param {SyncList}
 * @param {Sync}
 * @constructor
 */
function Mirror(client)
{
	/** @var {Client} */
	this.client = client;

	/** @var {Object.<string,boolean>} */
	this.walked = {};

	/** @var {Object.<string,Object>} */
	this.tree = {};

	/** @var {Object.<string,Object>} */
	this.stat = {};

	/** @var {Object} */
	this.startpoint = {};

	/** @var {int} */
	this.counter = 0;

	/** @var {int} */
	this.status = Mirror.STATUS_DONE;

	/** @var {function} */
	this.cb = null;
};


/** @const {int} */
Mirror.STATUS_DONE     = 0;
Mirror.STATUS_PROCESS  = 1;


/**
 * @param {function}
 */
Mirror.prototype.run = function(cb)
{
	if (this.status === Mirror.STATUS_DONE) {
		this.status = Mirror.STATUS_PROCESS;
		this.cb     = cb;
		this.runMirror();

	} else {
		cb.call(this, false);
	}
};


/**
 * @protected
 */
Mirror.prototype.runMirror = function()
{
	this.done();
};


/**
 * @protected
 */
Mirror.prototype.done = function()
{
	if (this.status === Mirror.STATUS_DONE) {
		return;

	} else if (this.counter) {
		return;
	}

	for (var path in this.startpoint) {
		return;
	}

	this.status = Mirror.STATUS_DONE;

	if (this.cb) {
		var cb = this.cb;
		this.cb = cb;

		cb.call(this);
	}
};
