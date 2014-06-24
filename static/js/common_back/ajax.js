define('ajax', function(require, module, exports) {
	var $ajax = (function(window, undefined) {
		var oXHRCallbacks, xhrCounter = 0;
		//在unload时没有取消连接，ie将保持连接。
		var fXHRAbortOnUnload = window.ActiveXObject ? function() {
			//取消所有等待中的请求
			for (var key in oXHRCallbacks) {
				oXHRCallbacks[key](0, 1);
			}
		} : false;
		return function(opt) {
			var o = {
				url: '', //必选，请求地址
				method: 'GET', //可选，发送方式，除非指明POST，否则全部为GET
				data: null, //可选，hashTable形式的字典
				type: "text", //可选，返回类型,text/xml/json
				async: true, //可选，是否为异步调用, true为异步，false为同步
				cache: false, //可选，是否缓存，默认不缓存
				timeout: 0, //可选，请求超时时间，单位：毫秒
				autoToken: true, //可选，是否自动为请求加上token
				username: '', //可选，用户名称
				password: '', //可选，密码
				beforeSend: $empty(), //可选，发送请求前所执行的函数,一般用于修改header，参数是XMLHttpRequest对象
				onSuccess: $empty(), //可选，请求成功返回时执行
				onError: $empty(), //可选，请求过程中发生错误时触发,超时状态值返回0，状态文本返回timeout
				onComplete: $empty() //可选，请求完成后执行
			};
			for (var key in opt) {
				o[key] = opt[key]
			}
			var callback, timeoutTimer, xhrCallbackHandle, ajaxLocation, ajaxLocParts;
			//如果设置了document.domain，当访问window.location的一个属性时，ie可能会抛出异常。
			try {
				ajaxLocation = location.href;
			} catch (e) {
				ajaxLocation = document.createElement("a");
				ajaxLocation.href = "";
				ajaxLocation = ajaxLocation.href;
			}
			ajaxLocParts = /^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/.exec(ajaxLocation.toLowerCase()) || [];
			o.isLocal = /^(?:about|app|app\-storage|.+\-extension|file|res|widget):$/.test(ajaxLocParts[1]);
			o.method = (typeof(o.method) != "string" || o.method.toUpperCase() != "POST") ? "GET" : "POST";
			o.data = (typeof o.data == "string") ? o.data : $makeUrl(o.data);
			if (o.method == 'GET' && o.data) {
				o.url += (o.url.indexOf("?") < 0 ? "?" : "&") + o.data;
			}
			if (o.autoToken) {
				o.url = $addToken(o.url, "ajax");
			}

			o.xhr = $xhrMaker();
			if (o.xhr === null) {
				return false;
			}
			try {
				if (o.username) {
					o.xhr.open(o.method, o.url, o.async, o.username, o.password);
				} else {
					o.xhr.open(o.method, o.url, o.async);
				}
			} catch (e) {
				o.onError(-2, e);
				return false;
			}

			if (o.method == 'POST') {
				o.xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
			}
			if (!o.cache) {
				o.xhr.setRequestHeader('If-Modified-Since', 'Thu, 1 Jan 1970 00:00:00 GMT');
				o.xhr.setRequestHeader('Cache-Control', 'no-cache');
			}

			o.beforeSend(o.xhr);

			if (o.async && o.timeout > 0) {
				if (o.xhr.timeout === undefined) {
					timeoutTimer = setTimeout(function() {
						if (o.xhr && callback) {
							callback(0, 1);
						}
						o.onError(0, null, 'timeout');
					}, o.timeout);
				} else { //支持ie8+,ff,opera
					o.xhr.timeout = o.timeout;
					//超时时会先执行readystatechange,后执行ontimeout。状态码为：
					//status:0, readyState:4
					//ff先执行onreadystatechange，再执行ontimeout
					//ie先执行ontimeout
					o.xhr.ontimeout = function() {
						if (o.xhr && callback) {
							callback(0, 1);
						}
						o.onError(0, null, 'timeout');
					};
				}
			}
			o.xhr.send(o.method == 'POST' ? o.data : null);
			callback = function(e, isAbort) {
				if (timeoutTimer) {
					clearTimeout(timeoutTimer);
					timeoutTimer = undefined;
				}
				if (callback && (isAbort || o.xhr.readyState === 4)) {
					callback = undefined;
					if (xhrCallbackHandle) {
						o.xhr.onreadystatechange = $empty();
						if (fXHRAbortOnUnload) {
							try {
								delete oXHRCallbacks[xhrCallbackHandle];
							} catch (e) {}
						}
					}
					if (isAbort) {
						if (o.xhr.readyState !== 4) {
							o.xhr.abort();
						}
					} else {
						var status, statusText, responses;
						responses = {
							headers: o.xhr.getAllResponseHeaders()
						};
						status = o.xhr.status;
						try {
							statusText = o.xhr.statusText;
						} catch (e) {
							statusText = "";
						}
						try {
							responses.text = o.xhr.responseText;
						} catch (e) {
							responses.text = "";
						}

						if (!status && o.isLocal) {
							status = responses.text ? 200 : 404;
						} else if (status === 1223) { // IE有时返回 1223 转换为204
							status = 204;
						}
						if (status >= 200 && status < 300) {
							//过滤系统自动设置的标签<!--[if !IE]>|xGv00|ac47d157e77260f69b76af9e560ab66e<![endif]-->
							responses.text = responses.text.replace(/<!--\[if !IE\]>[\w\|]+<!\[endif\]-->/g, '');
							switch (o.type) {
								case 'text':
									o.onSuccess(responses.text);
									break;
								case "json":
									var json;
									try {
										json = (new Function("return (" + responses.text + ")"))();
									} catch (e) {
										o.onError(status, e, responses.text);
									}
									if (json) {
										o.onSuccess(json);
									}
									break;
								case "xml":
									o.onSuccess(o.xhr.responseXML);
									break;
							}
						} else {
							if (status === 0 && o.timeout > 0) {
								//opera firefox 超时自动取消请求
								//o.xhr.abort();
								o.onError(status, null, 'timeout');
							} else {
								o.onError(status, null, statusText);
							}
						}
						o.onComplete(status, statusText, responses);
					}
					delete o.xhr;
				}
			};
			if (!o.async) { //同步调用的时候触发callback
				callback();
			} else if (o.xhr.readyState === 4) {
				// (IE6/7) 如何是缓存且已直接接收到数据则需要触发callback
				setTimeout(callback, 0);
			} else {
				xhrCallbackHandle = ++xhrCounter;
				if (fXHRAbortOnUnload) {
					if (!oXHRCallbacks) {
						oXHRCallbacks = {};
						//此处只处理IE
						if (window.attachEvent) {
							window.attachEvent("onunload", fXHRAbortOnUnload);
						} else {
							window["onunload"] = fXHRAbortOnUnload;
						}
					}
					oXHRCallbacks[xhrCallbackHandle] = callback;
				}
				o.xhr.onreadystatechange = callback;
			}
		};
	})(window, undefined)

	function $addToken(url, type, skey) {
		//type标识请求的方式,ls表loadscript，j132标识jquery，j126标识base，lk标识普通链接,fr标识form表单,ow打开新窗口
		var token = $getToken(skey);
		//只支持http和https协议，当url中无协议头的时候，应该检查当前页面的协议头
		if (url == "" || (url.indexOf("://") < 0 ? location.href : url).indexOf("http") != 0) {
			return url;
		}



		if (url.indexOf("#") != -1) {
			var f1 = url.match(/\?.+\#/);
			if (f1) {
				var t = f1[0].split("#"),
					newPara = [t[0], "&g_tk=", token, "&g_ty=", type, "#", t[1]].join("");
				return url.replace(f1[0], newPara);
			} else {
				var t = url.split("#");
				return [t[0], "?g_tk=", token, "&g_ty=", type, "#", t[1]].join("");
			}
		}
		//无论如何都把g_ty带上，用户服务器端判断请求的类型
		return token == "" ? (url + (url.indexOf("?") != -1 ? "&" : "?") + "g_ty=" + type) : (url + (url.indexOf("?") != -1 ? "&" : "?") + "g_tk=" + token + "&g_ty=" + type);
	};

	function $empty() {
		//返回全局空函数，不做任何事情，返回true；
		return function() {
			return true;
		}
	};

	function $getCookie(name) {
		//读取COOKIE
		var reg = new RegExp("(^| )" + name + "(?:=([^;]*))?(;|$)"),
			val = document.cookie.match(reg);
		return val ? (val[2] ? unescape(val[2]) : "") : null;
	};

	function $getToken(skey) {
		var skey = skey ? skey : $getCookie("skey");
		return skey ? $time33(skey) : "";
	};

	function $makeUrl(data) {
		//将json串组装成为url并返回
		var arr = [];
		for (var k in data) {
			arr.push(k + "=" + data[k]);
		};
		return arr.join("&");
	};

	function $time33(str) {
		//哈希time33算法
		for (var i = 0, len = str.length, hash = 5381; i < len; ++i) {
			hash += (hash << 5) + str.charAt(i).charCodeAt();
		};
		return hash & 0x7fffffff;
	};

	function $xhrMaker() {
		var xhr;
		try { // Firefox, Opera 8.0+, Safari
			xhr = new XMLHttpRequest();
		} catch (e) { //Internet Explorer
			try {
				xhr = new ActiveXObject("Msxml2.XMLHTTP");
			} catch (e) {
				try {
					xhr = new ActiveXObject("Microsoft.XMLHTTP");
				} catch (e) {
					xhr = null;
				}
			}
		};
		return xhr;
	}

	exports.ajax = $ajax;
});