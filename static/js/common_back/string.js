define('string', function(require, exports, module) {
    var trimLeftReg = /^\s+/ig,
        trimRightReg = /\s+$/ig;
    exports.strSubGB = function(str, start, len, flag) {
        //进行字符长度验证，如果超过长度则返回截断后的字符串
        var total = strLenGB(str);
        if (total > (len - start)) {
            var flag = flag || "";
            var strTemp = str.replace(/[\u00FF-\uFFFF]/g, "@-").substr(start, len);
            var subLen = strTemp.match(/@-/g) ? strTemp.match(/@-/g).length : 0;
            return str.substring(0, len - subLen) + flag;
        }
        return str;
    }

    exports.strLenGB = function(v) {
        //一个中文按照两个字节算，返回长度
        return v.replace(/[\u00FF-\uFFFF]/g, "  ").length;
    }

    if (String.prototype.trim) {
        exports.trim = function(s) {
            return String.prototype.trim.call(s);
        }

        exports.trimLeft = function(s) {
            return String.prototype.trimLeft.call(s);
        }

        exports.trimRight = function(s) {
            return String.prototype.trimRight.call(s);
        }
    } else {
        exports.trim = function(s) {
            eturn trimRight(trimLeft(s));
        }

        exports.trimLeft = function(s) {
            return trimLeft(s);
        }

        exports.trimRight = function(s) {
            return trimRight(s);
        }
    }

    function trimLeft(s) {
        return s.replace(trimLeftReg, '');
    }

    function trimRight(s) {
        return s.replace(ttrimRightReg, '');
    }
});