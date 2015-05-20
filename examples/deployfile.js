
var deploy = require('deployk');
var ftp = require('deployk-ftp');


// connect and create config instance
// specifies remote dir and tells to upload files in 2 parallel ftp connections
var conf = deploy.connect(ftp({
	// for connection details see node-ftp (or node-ssh2 in case of deployk-sftp)
}), '/path/to/remote/project/dir', 2);


// override dirRights, force 777 permission for 'temp', 'log' and 'sessions' dirs
conf.mixins('dirRights', function(dirname, path) {
	if (dirname==='temp' || dirname==='log' || dirname==='sessions') {
		return 777;
	}
});

// synchronize www folder to document_root
// ignores dir with less files (if detected, tool will delete it from remote server)
conf.sync('www', 'document_root')
	.ignoreDir('less', false);

// synchronize app folder
// ignores sessions dir, but keeps it at remote server
conf.sync('app')
	.ignoreDir('sessions', true);

// synchronize extra local file to path required by web application in production server
conf.sync('./.deploy/config.php', 'app/config.php');

// make sure that dir 'temp', 'log' and 'app/sessions' exist on remote server. Permissions handles dirRights function above
conf.keepDir('temp');
conf.keepDir('log');
conf.keepDir('app/sessions');

conf.glob('src/**/*.js').once(function() {
	var cb = this.promise('Compiling JavaScript files.');

	var self = this;
	__compileJavascript__(function(err) {
		if (err) {
			self.abort(err);
		}

		// when completed, notify about possible changes inside /www/build dir, so process can recompute changes
		cb('/www/build');
	});
});

conf.watch('**/*.php', '**/*.latte').once(function() {
	// once .php or .latte file is changed, force removing of remote temp dir
	// conf.keepDir('temp') keeps it present, but it's cleared
	this.purge('temp');
});

// beforeend is called after deployment is completed
conf.beforeend(function() {
	var cb = this.wait('Requesting mainpage to warm cache, etc.');

	__makeRequest__('http://www.example.com/', function() {
		cb();
	});
});
