

var Mockfs = require('./lib/Mockfs.js');


var tree = new Mockfs({
	'app': {
		'bootstrap.php': 1,
		'templates': {
			'@layout.latte': 3,
			'Front': {}
		}
	}
});


exports.root = function(test) {
	tree.readdir('/', function(err, files) {
		test.same(['app'], Object.keys(files));
		test.done();
	});
}

exports.file = function(test) {
	tree.readdir('/app/bootstrap.php', function(err, files) {
		test.equal(undefined, files)
		test.done();
	});
}


exports.directory = function(test) {
	tree.readdir('/app/templates', function(err, files) {
		test.same(['@layout.latte', 'Front'], Object.keys(files));
		test.done();
	});
}

exports.invalid = function(test) {
	tree.readdir('/app/invalid', function(err, files) {
		test.equal(undefined, files);
		test.done();
	});
};

exports.statMissing = function(test) {
	tree.stat('/missing', function(err, file) {
		test.notEqual(undefined, err);
		test.equal(undefined, file);
		test.done();
	});
};

exports.statDirectory = function(test) {
	tree.stat('/app', function(err, file) {
		test.equal(undefined, err);
		test.notEqual(undefined, file);
		test.ok(file.isDirectory());
		test.done();
	});
};

exports.statFile = function(test) {
	tree.stat('/app/bootstrap.php', function(err, file) {
		test.equal(undefined, err);
		test.notEqual(undefined, file);
		test.ok(file.isFile());
		test.done();
	});
};
