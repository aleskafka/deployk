

var Mockfs = require('../lib/Mockfs');


module.exports = new Mockfs({
	'remote': {
		'app': {
			'bootstrap.php': 2,
			'sessions': {
				'sess_2': 1
			},
			'services': 1,
			'helper': {},
			'templates': {
				'@layout.latte': 4,
				'FrontModule': {
					'default.latte': 1,
					'remove.latte': 2
				}
			},
			'remove': {
				'index.php': 1,
				'keep': {},
				'remove': {
					'file.php': 1
				}
			}
		}
	}
});
