
var p = require('path');
var PathRouter = require('../lib/Router/PathRouter');


exports.path = function(test) {
	var router = new PathRouter();

	router.register('/example/path', 1);

	test.equals(1, router.find('/example/path/to/file/').length);
	test.equals(1, router.find('/example/path/to/file').length);
	test.equals(1, router.find('/example/path/').length);
	test.equals(1, router.find('/example/path').length);
	test.equals(0, router.find('/example/pathlong').length);
	test.equals(0, router.find('/example/pathlong/to/file').length);
	test.equals(0, router.find('/example/pa').length);
	test.equals(0, router.find('/example/pa/to/file').length);
	test.equals(0, router.find('/example').length);
	test.equals('/example/pa/', router.findSpeedUp('/example/pa/to/file'));

	test.done();
};


exports.pathSep = function(test) {
	var router = new PathRouter();

	router.register('/example/path/', 1);

	test.equals(1, router.find('/example/path/to/file/').length);
	test.equals(1, router.find('/example/path/to/file').length);
	test.equals(1, router.find('/example/path/').length);
	test.equals(1, router.find('/example/path').length);
	test.equals(0, router.find('/example/pathlong').length);
	test.equals(0, router.find('/example/pathlong/to/file').length);
	test.equals(0, router.find('/example/pa').length);
	test.equals(0, router.find('/example/pa/to/file').length);
	test.equals('/example/pa/', router.findSpeedUp('/example/pa/to/file'));

	test.done();
};

exports.pathEmpty = function(test) {
	var router = new PathRouter();

	router.register('/', 1);

	test.equals(1, router.find('/example/path/to/file/').length);
	test.equals(1, router.find('/example').length);
	test.equals(1, router.find('/').length);
	test.equals(1, router.find('').length);
	test.equals('', router.findSpeedUp('/example/pa/to/file'));

	test.done();
};
