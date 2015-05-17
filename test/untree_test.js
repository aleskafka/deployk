

var UntreeEmitter = require('../lib/Mirror-Diff/UntreeEmitter');
var TestEmitter = require('./mirror-diff/TestEmitter');


module.exports.testPutEmpty = function(test) {
	var testEmitter = new TestEmitter();
	var testUntree  = new UntreeEmitter(testEmitter);

	testUntree.emitOp('putDir', '/app', {'/app': {}});

	test.deepEqual([['putDir', '/app', {'/app': {}}]], testEmitter.changes);
	test.done();
}


module.exports.testPut = function(test) {
	var testEmitter = new TestEmitter();
	var testUntree  = new UntreeEmitter(testEmitter);

	testUntree.emitOp('putDir', '/app', {
		'/app': {
			'templates': true,
			'bootstrap.php': true
		},
		'/app/templates': {
			'@layout.latte': true
		},
		'/app/templates/@layout.latte': true,
		'/app/bootstrap.php': true
	});

	test.deepEqual([
		['putDir', '/app', {'/app': {}}],
		['putDir', '/app/templates', {'/app/templates': {}}],
		['putFile', '/app/templates/@layout.latte', '/app/templates/@layout.latte'],
		['putFile', '/app/bootstrap.php', '/app/bootstrap.php']
	], testEmitter.changes);

	test.done();
};


module.exports.testDeleteEmpty = function(test) {
	var testEmitter = new TestEmitter();
	var testUntree  = new UntreeEmitter(testEmitter);

	testUntree.emitOp('deleteDir', '/app', {'/app': {}});

	test.deepEqual([['deleteDir', '/app', {'/app': {}}]], testEmitter.changes);
	test.done();
}


module.exports.testDelete = function(test) {
	var testEmitter = new TestEmitter();
	var testUntree  = new UntreeEmitter(testEmitter);

	testUntree.emitOp('deleteDir', '/app', {
		'/app': {
			'templates': true,
			'bootstrap.php': true
		},
		'/app/templates': {
			'@layout.latte': true
		},
		'/app/templates/@layout.latte': true,
		'/app/bootstrap.php': true
	});

	test.deepEqual([
		['deleteFile', '/app/templates/@layout.latte'],
		['deleteDir', '/app/templates', {'/app/templates': {}}],
		['deleteFile', '/app/bootstrap.php'],
		['deleteDir', '/app', {'/app': {}}]
	], testEmitter.changes);

	test.done();
};
