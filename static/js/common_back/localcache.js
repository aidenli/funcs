define('localcache', function(require, exports, module) {
	var storage = window.localStorage,
		prefix = '$lc_',
		//默认配置
		defaultSet = {
			expires: 1440 //默认时间为1440分钟即1天
		};
	if (!storage) return;
	//查找过期的storage并删除
	for (var k in storage) {
		try {
			if (k.indexOf(prefix) === 0) {
				getStorageObj(k);
			}
		} catch (e) {}
	}
	//序列化JSON对象
	function JsonToStr(o) {
		if (o == undefined) {
			return "";
		}
		if (JSON && JSON.stringify) { //ie8以上都支持
			return JSON.stringify(o);
		} else {
			var r = [];
			if (typeof o == "string") return "\"" + o.replace(/([\"\\])/g, "\\$1").replace(/(\n)/g, "\\n").replace(/(\r)/g, "\\r").replace(/(\t)/g, "\\t") + "\"";
			if (typeof o == "object") {
				if (!o.sort) {
					for (var i in o)
						r.push("\"" + i + "\":" + JsonToStr(o[i]));
					if ( !! document.all && !/^\n?function\s*toString\(\)\s*\{\n?\s*\[native code\]\n?\s*\}\n?\s*$/.test(o.toString)) {
						r.push("toString:" + o.toString.toString());
					}
					r = "{" + r.join() + "}"
				} else {
					for (var i = 0; i < o.length; i++)
						r.push(JsonToStr(o[i]))
					r = "[" + r.join() + "]";
				}
				return r;
			}
			return o.toString().replace(/\"\:/g, '":""');
		}
	}
	//清除storage
	function clearStorage() {
		for (var k in storage) {
			if (k.indexOf(prefix) === 0) {
				storage.removeItem(k);
			}
		}
	}
	//删除storage
	function removeStorage(name) {
		storage.removeItem(prefix + name);
	}
	//设置Storage
	function setStorage(name, value, expires) {
		var timeNow = new Date(),
			timeNowUnix = timeNow.getTime(),
			absExpires;
		expires = parseInt(expires ? expires : defaultSet.expires);
		absExpires = timeNow.setMinutes(timeNow.getMinutes() + expires);
		
		if (name && absExpires > timeNowUnix) {
			storage.removeItem(prefix + name);
			storage.setItem(prefix + name, JsonToStr({
				name: name,
				value: value,
				expires: absExpires
			}));
		}
	}
	//获取storage对象
	function getStorageObj(name) {
		var storageObj, timeNow = new Date();
		if (JSON && JSON.parse) {
			storageObj = JSON.parse(storage.getItem(name));
		} else {
			storageObj = eval('(' + storage.getItem(name) + ')');
		}
		if (storageObj && timeNow.getTime() < storageObj.expires) {
			return storageObj;
		} else {
			storage.removeItem(name);
			return null;
		}
	}
	//获取storage值
	function getStorage(name) {
		var storageObj = getStorageObj(prefix + name);
		return storageObj ? storageObj.value : null;
	}

	return {
		set: function(name, value, expires) {
			try {
				setStorage(name, value, expires);
				return this;
			} catch (e) {}
		},
		get: function(name) {
			try {
				return getStorage(name);
			} catch (e) {}
		},
		remove: function(name) {
			try {
				removeStorage(name);
				return this;
			} catch (e) {}
		},
		clear: function() {
			try {
				clearStorage();
				return this;
			} catch (e) {}
		},
		setDefault: function(cfg) {
			for (var k in cfg) {
				if (defaultSet[k]) defaultSet[k] = cfg[k];
			}
		}
	}
});