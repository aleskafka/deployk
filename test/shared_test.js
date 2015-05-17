

var SharedTree = require('../lib/Mirror-Diff/SharedTree');
var SharedEmitter = require('../lib/Mirror-Diff/SharedEmitter');
var TestEmitter = require('./mirror-diff/TestEmitter');

var sharedTree = (new SharedTree())
	.add('/')
	.add('/app/templates/')
	.add('/www/');


module.exports.testPutEmpty = function(test) {
	var testEmitter = new TestEmitter();
	var testShared  = new SharedEmitter(testEmitter, sharedTree);

	testShared.emitOp('putDir', '/app', {'/app': {}});

	test.deepEqual([], testEmitter.changes);
	test.done();
}


module.exports.testPut = function(test) {
	var testEmitter = new TestEmitter();
	var testShared  = new SharedEmitter(testEmitter, sharedTree);

	testShared.emitOp('putDir', '/app', {
		'/app': {
			'templates': true,
			'presenters': true,
			'bootstrap.php': true
		},
		'/app/templates': {
			'@layout.latte': true
		},
		'/app/presenters': {
			'FrontPresenter.php': true,
		},
		'/app/templates/@layout.latte': true,
		'/app/presenters/FrontPresenter.php': true,
		'/app/bootstrap.php': true
	});

	testShared.emitOp('putFile', '/config.neon', '/config.neon');
	testShared.emitOp('putDir', '/www', {'/www': {}});

	test.deepEqual([
		['putFile', '/app/templates/@layout.latte', '/app/templates/@layout.latte'],
		['putDir', '/app/presenters', {'/app/presenters': {'FrontPresenter.php': true}, '/app/presenters/FrontPresenter.php': true}],
		['putFile', '/app/bootstrap.php', '/app/bootstrap.php'],
		['putFile', '/config.neon', '/config.neon']
	], testEmitter.changes);

	test.done();
};
