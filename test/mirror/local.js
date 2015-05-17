

var Mockfs = require('../lib/Mockfs');


module.exports = new Mockfs({
	'remote_config.neon': 1,
	'app': {
		'config.neon': 1,
		'config': 1,
		'bootstrap.php': 2,
		'sessions': {
			'sess_1': 1
		},
		'templates': {
			'@layout.latte': 4,
			'FrontModule': {
				'default.latte': 1
			}
		},
		'temp': {
			'configurator-c564be1.php': 1
		}
	},
	'libs': {},
	'www': {
		'index.php': 5,
		'assets': {
			'less': {
				'combined.less': 6,
				'mixins.less': 7
			},
			'combined.css': 8
		}
	}
});
