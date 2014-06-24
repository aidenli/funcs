define('encode', function(require, exports, module) {
    exports.htmlDecode = function(str) {
        return typeof(str) != "string" ? "" : str.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&nbsp;/g, " ").replace(/&#39;/g, "'").replace(/&amp;/g, "&");
    }

    exports.htmlEncode = function(str) {
        return typeof(str) != "string" ? "" : str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/\'/g, "&apos;").replace(/ /g, "&nbsp;");
    }

    exports.xss = function(str, type) {
        //空过滤
        if (!str) {
            return str === 0 ? "0" : "";
        }

        switch (type) {
            case "none": //过度方案
                return str + "";
                break;
            case "html": //过滤html字符串中的XSS
                return str.replace(/[&'"<>\/\\\-\x00-\x09\x0b-\x0c\x1f\x80-\xff]/g, function(r) {
                    return "&#" + r.charCodeAt(0) + ";"
                }).replace(/ /g, " ").replace(/\r\n/g, "<br />").replace(/\n/g, "<br />").replace(/\r/g, "<br />");
                break;
            case "htmlEp": //过滤DOM节点属性中的XSS
                return str.replace(/[&'"<>\/\\\-\x00-\x1f\x80-\xff]/g, function(r) {
                    return "&#" + r.charCodeAt(0) + ";"
                });
                break;
            case "url": //过滤url
                return escape(str).replace(/\+/g, "%2B");
                break;
            case "miniUrl":
                return str.replace(/%/g, "%25");
                break;
            case "script":
                return str.replace(/[\\"']/g, function(r) {
                    return "\\" + r;
                }).replace(/%/g, "\\x25").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\x01/g, "\\x01");
                break;
            case "reg":
                return str.replace(/[\\\^\$\*\+\?\{\}\.\(\)\[\]]/g, function(a) {
                    return "\\" + a;
                });
                break;
            default:
                return escape(str).replace(/[&'"<>\/\\\-\x00-\x09\x0b-\x0c\x1f\x80-\xff]/g, function(r) {
                    return "&#" + r.charCodeAt(0) + ";"
                }).replace(/ /g, " ").replace(/\r\n/g, "<br />").replace(/\n/g, "<br />").replace(/\r/g, "<br />");
                break;
        }
    }
});