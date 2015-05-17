

var Mockfs = require('../lib/Mockfs');


module.exports = new Mockfs({
	'app': {
		'config.neon': 1,
		'bootstrap.php': 2,
		'sessions': {
			'sess_1': 1
		},
		'services': {
			'user.php': 1
		},
		'helper': 1,
		'templates': {
			'@layout.latte': 4,
			'FrontModule': {
				'default.latte': 1,
				'main.latte': 1
			}
		},
		'libs': {
			'nette': {}
		},
		'subtree': {
			'remove_file.js': 1
		}
	}
});
