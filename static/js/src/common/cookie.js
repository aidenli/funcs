/**
 * cookie模块
 * 	get
 * 	set
 * 	del
 */
define(function(require, exports, module) {
	/**
	 * 获取cookie
	 * @param  {[String]} name [cookie名称]
	 * @return {[String]}      [cookie值]
	 */
	exports.get = function (name) {
		//读取COOKIE
		var reg = new RegExp("(^| )" + name + "(?:=([^;]*))?(;|$)"),
			val = document.cookie.match(reg);
		return val ? (val[2] ? unescape(val[2]) : "") : "";
	}

	/**
	 * 设置cookie
	 * @param {[String]} name    [cookie名称]
	 * @param {[String]} value   [cookie值]
	 * @param {[Number]} expires [过期时间（分钟）]
	 * @param {[String]} path    [子路径]
	 * @param {[String]} domain  [域名]
	 * @param {[String]} secure  [description]
	 */
	exports.set = function (name, value, expires, path, domain, secure) {
		//写入COOKIES
		var exp = new Date(),
			expires = arguments[2] || null,
			path = arguments[3] || "/",
			domain = arguments[4] || null,
			secure = arguments[5] || false;
		expires ? exp.setMinutes(exp.getMinutes() + parseInt(expires)) : "";
		document.cookie = name + '=' + escape(value) + (expires ? ';expires=' + exp.toGMTString() : '') + (path ? ';path=' + path : '') + (domain ? ';domain=' + domain : '') + (secure ? ';secure' : '');
	}

	/**
	 * 删除cookie
	 * @param  {[type]} name   [cookie名称]
	 * @param  {[type]} path   [子路径]
	 * @param  {[type]} domain [域名]
	 * @param  {[type]} secure [description]
	 */
	exports.del = function (name, path, domain, secure) {
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