define("date", function(require, exports, module) {
	exports.format = function(date, formatStr) {
		//格式化时间
		var arrWeek = ['日', '一', '二', '三', '四', '五', '六'],
			str = formatStr
			.replace(/yyyy|YYYY/, date.getFullYear())
			.replace(/yy|YY/, addZero(date.getFullYear() % 100, 2))
			.replace(/mm|MM/, addZero(date.getMonth() + 1, 2))
			.replace(/m|M/g, date.getMonth() + 1)
			.replace(/dd|DD/, addZero(date.getDate(), 2))
			.replace(/d|D/g, date.getDate())
			.replace(/hh|HH/, addZero(date.getHours(), 2))
			.replace(/h|H/g, date.getHours())
			.replace(/ii|II/, addZero(date.getMinutes(), 2))
			.replace(/i|I/g, date.getMinutes())
			.replace(/ss|SS/, addZero(date.getSeconds(), 2))
			.replace(/s|S/g, date.getSeconds())
			.replace(/w/g, date.getDay())
			.replace(/W/g, arrWeek[date.getDay()]);
		return str;
	}

	exports.getTimeDistance = function(ts) {
		//根据时间差计算剩余的时间，返回[天，小时，分，秒]
		var timeLeft = [0, 0, 0, 0]; //结构：天、小时、分、秒
		timeLeft[0] = (ts > 86400) ? parseInt(ts / 86400) : 0;
		ts = ts - timeLeft[0] * 86400;
		timeLeft[1] = (ts > 3600) ? parseInt(ts / 3600) : 0;
		ts = ts - timeLeft[1] * 3600;
		timeLeft[2] = (ts > 60) ? parseInt(ts / 60) : 0;
		timeLeft[3] = ts - timeLeft[2] * 60;
		return timeLeft;
	}

	exports.getTimeInterval = function(st, et) {
		//返回两个时间之间的间隔的描述字符串
		var dateLeft = 0;
		var hourLeft = 0;
		var minuteLeft = 0;
		var secondLeft = 0;
		var timeLeft = [0, 0, 0, 0]; //结构：天、小时、分、秒
		var timeStr = "";
		var ts = (et > st) ? parseInt((et - st) / 1000) : 0;
		timeLeft[0] = (ts > 86400) ? parseInt(ts / 86400) : 0;
		ts = ts - timeLeft[0] * 86400;
		timeLeft[1] = (ts > 3600) ? parseInt(ts / 3600) : 0;
		ts = ts - timeLeft[1] * 3600;
		timeLeft[2] = (ts > 60) ? parseInt(ts / 60) : 0;
		timeLeft[3] = ts - timeLeft[2] * 60;
		timeStr = (timeLeft[0] > 0) ? timeLeft[0] + "天" : "";
		timeStr += (timeLeft[0] <= 0 && timeLeft[1] <= 0) ? "" : (timeLeft[1] + "小时");
		timeStr += (timeLeft[0] <= 0 && timeLeft[1] <= 0 && timeLeft[2] <= 0) ? "" : (timeLeft[2] + "分钟");
		timeStr += (timeLeft[0] <= 0 && timeLeft[1] <= 0 && timeLeft[2] <= 0 && timeLeft[3] <= 0) ? "" : timeLeft[3] + "秒";
		return timeStr;
	}

	exports.getServerTime = function(url) {
		var sysTime = document.getElementById('SYSTIME');
		if (sysTime) {
			var ts = sysTime.value.substring(0, 19).split('-'),
				dObj = new Date(ts[0], parseInt(ts[1], 10) - 1, ts[2], ts[3], ts[4], ts[5]);
			return dObj;
		}
		var xhr = $xhrMaker(),
			url = url || "http://" + window.location.hostname + "/favicon.ico";
		try {
			xhr.open("HEAD", url, false);
			xhr.send();
		} catch (e) {
			return new Date();
		}
		return new Date(xhr.getResponseHeader("Date"));
	}

	function addZero(v, size) {
		for (var i = 0, len = size - (v + "").length; i < len; i++) {
			v = "0" + v;
		};
		return v + "";
	}

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

});