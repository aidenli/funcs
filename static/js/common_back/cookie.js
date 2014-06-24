define(function(require, exports, module) {
	exports.get = getCookie;
	exports.set = setCookie;
	exports.del = delCookie;

	function getCookie(name) {
		//读取COOKIE
		var reg = new RegExp("(^| )" + name + "(?:=([^;]*))?(;|$)"),
			val = document.cookie.match(reg);
		return val ? (val[2] ? unescape(val[2]) : "") : null;
	}

	function setCookie(name, value, expires, path, domain, secure) {
		//写入COOKIES
		var exp = new Date(),
			expires = arguments[2] || null,
			path = arguments[3] || "/",
			domain = arguments[4] || null,
			secure = arguments[5] || false;
		expires ? exp.setMinutes(exp.getMinutes() + parseInt(expires)) : "";
		document.cookie = name + '=' + escape(value) + (expires ? ';expires=' + exp.toGMTString() : '') + (path ? ';path=' + path : '') + (domain ? ';domain=' + domain : '') + (secure ? ';secure' : '');
	}

	function delCookie(name, path, domain, secure) {
		//删除cookie
		var value = getCookie(name);
		if (value != null) {
			var exp = new Date();
			exp.setMinutes(exp.getMinutes() - 1000);
			path = path || "/";
			document.cookie = name + '=;expires=' + exp.toGMTString() + (path ? ';path=' + path : '') + (domain ? ';domain=' + domain : '') + (secure ? ';secure' : '');
		}
	}
});