define('client', function(require, module, exports) {
	exports.isRetina = function() {
		return window.devicePixelRatio >= 2 ? true : false;
	}

	exports.browser = function() {

	}

	exports.checkWebp = function(callback) {
		var supportWebp;
		if (supportWebp === undefined) {
			var img = new Image();

			var tid = setTimeout(function() {
				supportWebp = false;
				callback && callback(supportWebp, true);
				img.onload = img.onerror = null;
				img = null;
			}, 500);

			img.onload = img.onerror = function() {
				clearTimeout(tid);
				supportWebp = img.width === 2 && img.height === 2;
				callback && callback(supportWebp, false);
			};

			img.src = "data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA";

			// 上报返回码统计支持率
			var retObj = returnCode.init({
				url: 'http://mm.wanggou.com/checkWebpAsync'
			});
		} else {
			callback && callback(supportWebp);
		}
	}
});