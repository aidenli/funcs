define('request', function(require, exports, module) {
    exports.loadScript = $loadScript;

    function $loadScript(obj) {
        //创建一个script并加载script
        //原始参数：id:'放置script的id',  url:'载入的地址',obj:'其他配置';
        //定义全局计数器
        if (!$loadScript.counter) {
            $loadScript.counter = 1;
        }
        var isObj = typeof(obj) == "object",
            url = isObj ? obj.url : arguments[0],
            id = isObj ? obj.id : arguments[1],
            obj = isObj ? obj : arguments[2], //参数处理
            _head = document.head || document.getElementsByTagName("head")[0] || document.documentElement, //
            _script = document.createElement("script"),
            D = new Date(),
            _time = D.getTime(), //script标签的属性id的时间戳
            _isCleared = false,
            _timer = null, //定时器对象
            o = obj || {}, //扩展参数对象
            data = o.data || '', //可选，get数据  支持对象{p1:1,p2:2}和字符串p1=1&p2=2
            charset = o.charset || "gb2312", //可选，编码方式
            isToken = o.isToken, //可选，是否添加token验证
            timeout = o.timeout, //可选，超时时间，单位：毫秒
            isAutoReport = o.isAutoReport || false, //可选，是否自动返回码上报，true/false 默认为false
            reportOptions = o.reportOptions || {}, //可选，返回码上报组件的参数，同组件$returnCode
            reportType = o.reportType || 'current',
            //可选，支持两种返回码上报方式：current 和 cross，前者是当前页cgi上报，后者是跨页面上报
            reportRetCodeName = o.reportRetCodeName,
            //可选，异步接口返回数据的错误码字段名称，无默认值。
            reportSuccessCode = typeof(o.reportSuccessCode) == "undefined" ? 200 : o.reportSuccessCode,
            //可选，接口返回成功的状态码，默认为200，指cgi成功返回。设置了reportRetCodeName时，reportSuccessCode将无效。
            reportErrorCode = typeof(o.reportErrorCode) == "undefined" ? 500 : o.reportErrorCode,
            //可选，接口返回错误的状态码，默认为500，泛指cgi不可用。
            reportTimeoutCode = typeof(o.reportTimeoutCode) == "undefined" ? 600 : o.reportTimeoutCode,
            //可选，接口超时的状态码，默认为600，指cgi超时。
            onload = o.onload, //可选，加载完成
            onsucc = o.onsucc,
            callbackName = o.callbackName || '', //可选，回调函数名称
            callback = o.callback, //可选，回调函数体
            errorback = o.errorback, //可选，错误回调函数体，参数为错误码。
            _jsonpLoadState = 'uninitialized';
        /**清除处理函数
         *  @errCode: reportSuccessCode, reportErrorCode,  reportTimeoutCode
         */
        var complete = function(errCode) {
            //防止重复执行的问题
            if (!_script || _isCleared) {
                return;
            }
            _isCleared = true;

            //清除定时器
            if (_timer) {
                clearTimeout(_timer);
                _timer = null;
            }

            //防止IE内存泄漏
            _script.onload = _script.onreadystatechange = _script.onerror = null;

            //清除script元素
            if (_head && _script.parentNode) {
                _head.removeChild(_script);
            }
            _script = null;

            //清除全局临时回调函数
            if (callbackName) {
                if (callbackName.indexOf('.') == -1) {
                    window[callbackName] = null;
                    try {
                        delete window[callbackName];
                    } catch (e) {}
                } else {
                    var arrJ = callbackName.split("."),
                        p = {};
                    for (var j = 0, jLen = arrJ.length; j < jLen; j++) {
                        var n = arrJ[j];
                        if (j == 0) {
                            p = window[n];
                        } else {
                            if (j == jLen - 1) {
                                try {
                                    delete p[n];
                                } catch (e) {}
                            } else {
                                p = p[n];
                            }
                        }
                    }
                }
            }

            //CGI返回数据错误或超时时执行
            if (_jsonpLoadState != "loaded" && typeof errorback == "function") {
                errorback(errCode);
            }

            //返回码自动上报
            if (isAutoReport && reportType != 'cross') {
                _retCoder.report(_jsonpLoadState == "loaded", errCode);
            }

        };
        var jsontostr = function(d) {
            var a = [];
            for (var k in d) {
                a.push(k + '=' + d[k]);
            }
            return a.join('&');
        };
        //定义返回码自动上报
        if (isAutoReport && reportOptions) {
            if (reportType == 'cross') {
                //页面1打开的时候注册一个action
                $returnCode(reportOptions).reg();
            } else {
                reportOptions.url = reportOptions.url || url.substr(0, url.indexOf('?') == -1 ? url.length : url.indexOf('?'));
                var _retCoder = $returnCode(reportOptions);
            }
        }

        if (data) {
            url += (url.indexOf("?") != -1 ? "&" : "?") + (typeof data == 'string' ? data : jsontostr(data));
        }

        //创建一个临时全局函数，执行回调函数
        if (callbackName && typeof callback == "function") {
            var oldName = callbackName;
            if (callbackName.indexOf('.') == -1) {
                callbackName = window[callbackName] ? callbackName + $loadScript.counter++ : callbackName;
                window[callbackName] = function(jsonData) {
                    _jsonpLoadState = 'loaded';
                    if (isAutoReport && reportRetCodeName) {
                        reportSuccessCode = jsonData[reportRetCodeName];
                    }
                    //原生的回调函数,改为此方式保证非单一参数回调的正确执行
                    callback.apply(null, arguments);
                    onsucc && (onsucc());
                };
            } else {
                var arrJ = callbackName.split("."),
                    p = {},
                    arrF = [];
                for (var j = 0, jLen = arrJ.length; j < jLen; j++) {
                    var n = arrJ[j];
                    if (j == 0) {
                        p = window[n];
                    } else {
                        if (j == jLen - 1) {
                            p[n] ? (n = n + $loadScript.counter++) : '';
                            p[n] = function(jsonData) {
                                _jsonpLoadState = 'loaded';
                                if (isAutoReport && reportRetCodeName) {
                                    reportSuccessCode = jsonData[reportRetCodeName];
                                }
                                //原生的回调函数,改为此方式保证非单一参数回调的正确执行
                                callback.apply(null, arguments);
                                onsucc && (onsucc());
                            };
                        } else {
                            p = p[n];
                        }
                    }
                    arrF.push(n);
                }
                callbackName = arrF.join('.');
            }
            url = url.replace('=' + oldName, '=' + callbackName);
        }


        _jsonpLoadState = 'loading';
        id = id ? (id + _time) : _time;
        url = (isToken !== false ? $addToken(url, "ls") : url);
        _script.charset = charset;
        _script.id = id;

        //加载jsonp数据成功
        _script.onload = _script.onreadystatechange = function() {
            var uA = navigator.userAgent.toLowerCase();
            //非ie与ie判断
            if (!(!(uA.indexOf("opera") != -1) && uA.indexOf("msie") != -1) || /loaded|complete/i.test(this.readyState)) {
                if (typeof onload == "function") {
                    onload();
                }
                //loaded
                complete(_jsonpLoadState == "loaded" ? reportSuccessCode : reportErrorCode);
            }
        };
        //加载jsonp数据错误，支持safari,chrome,firefox,ie9
        _script.onerror = function() {
            //cgi error
            complete(reportErrorCode);
        };
        //设置超时
        if (timeout) {
            _timer = setTimeout(function() {
                complete(reportTimeoutCode);
            }, parseInt(timeout, 10));
        }
        setTimeout(function() {
            //在IE下执行此语句时，则会发出请求；其他浏览器则需要插入dom后才会发出请求。
            _script.src = url;
            try { //加了个try catch, 在IE6，IE7下，上面执行_script.src后，_script会为null，然后insertBefore就报错了，虽然也不会弹窗，但为了避免对自测试的干扰，这里加入了try catch，排除这个错误。
                _head.insertBefore(_script, _head.lastChild);
            } catch (e) {}
        }, 0);
    }

    function $addToken(url, type) {
        //type标识请求的方式,ls表loadscript，j132标识jquery，j126标识base，lk标识普通链接,fr标识form表单,ow打开新窗口
        var token = $getToken();
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

    function $getCookie(name) {
        //读取COOKIE
        var reg = new RegExp("(^| )" + name + "(?:=([^;]*))?(;|$)"),
            val = document.cookie.match(reg);
        return val ? (val[2] ? unescape(val[2]) : "") : null;
    };

    function $getToken() {
        var skey = $getCookie("skey"),
            token = skey == null ? "" : $time33(skey);
        return token;
    };

    function $loadUrl(o) {
        o.element = o.element || 'script';
        var el = document.createElement(o.element);
        el.charset = o.charset || 'utf-8';
        if (o.noCallback == true) {
            el.setAttribute("noCallback", "true");
        }
        el.onload = el.onreadystatechange = function() {
            if (/loaded|complete/i.test(this.readyState) || navigator.userAgent.toLowerCase().indexOf("msie") == -1) {
                clear();
            }
        };
        el.onerror = function() {
            clear();
        };
        el.src = o.url;

        document.getElementsByTagName('head')[0].appendChild(el);

        function clear() {
            if (!el) {
                return;
            }
            el.onload = el.onreadystatechange = el.onerror = null;
            el.parentNode && (el.parentNode.removeChild(el));
            el = null;
        }
    };

    function $report(url) {
        $loadUrl({
            'url': url + ((url.indexOf('?') == -1) ? '?' : '&') + "cloud=true&" + Math.random(),
            'element': 'img'
        });
    };

    function $returnCode(opt) {
        //返回码上报组件
        var option = {
            url: "", //需要上报的接口url，用于上报异步请求的返回码
            action: "", //需要上报的功能名称，用于拼装伪地址，与url互斥，用于上报跨业务
            sTime: "", //请求开始时间
            eTime: "", //响应结束时间
            retCode: "", //请求返回是否成功，成功1，失败2
            errCode: "", //请求返回错误码：=errcode
            frequence: 1, //采样频率，1/n，这个数值为分母，数字越小采样频率越高
            refer: location.href, //异步请求的refer是当前页面
            uin: "", //用户QQ(uin) 只做详细记录查询，不做统计； 如果没有上报，cgi会从cookie中去解析uin字段
            domain: "paipai.com", //设置的域名，用于设置cookie
            from: 1, //上报的场景     0为clien，1为web
            report: report, //进行上报的方法
            isReport: false, //是否已经上报过
            timeout: 3000, //超过这个时间后，将会上报cgi请求失败，会上报errCode=timeoutCode，（404或是没有执行$returnCode.report方法的时候都会上报）
            timeoutCode: 444, //超时码
            formatUrl: true, //是否删除上报url的query参数，默认为true删除
            reg: reg //跨页面上报的方法，用reg方法启动
        };
        for (var i in opt) {
            option[i] = opt[i];
        }
        if (option.url) {
            //开始计时
            option.sTime = new Date();
        }

        if (option.timeout) {
            setTimeout(function() {
                if (!option.isReport) { //没有执行过上报时  就上报
                    option.report(true, option.timeoutCode);
                }
            }, option.timeout);
        }
        //如果参数action不为空，则表示是非异步接口类上报，将当前信息写入cookie
        function reg() {
            this.sTime = new Date();
            if (!this.action) {
                return;
            }
            var rcookie = $getCookie("retcode"),
                cookie2 = [];
            rcookie = rcookie ? rcookie.split("|") : [];
            for (var i = 0; i < rcookie.length; i++) {
                if (rcookie[i].split(",")[0] != this.action) {
                    cookie2.push(rcookie[i]);
                }
            }
            cookie2.push(this.action + "," + this.sTime.getTime());
            $setCookie("retcode", cookie2.join("|"), 60, "/", this.domain);
        }

        //返回码上报方法,参数：是否成功请求（true,false），返回码（如果无返回码则直接上报错误码）
        function report(ret, errid) {
            this.isReport = true;
            //计时
            this.eTime = new Date();
            //是否成功，成功1，失败2
            this.retCode = ret ? 1 : 2;
            this.errCode = isNaN(parseInt(errid)) ? "0" : parseInt(errid);
            if (this.action) {
                this.url = "http://retcode.paipai.com/" + this.action;
                var rcookie = $getCookie("retcode"),
                    ret = "",
                    ncookie = [];
                rcookie = rcookie ? rcookie.split("|") : [];
                for (var i = 0; i < rcookie.length; i++) {
                    if (rcookie[i].split(",")[0] == this.action) {
                        ret = rcookie[i].split(",");
                    } else {
                        ncookie.push(rcookie[i]);
                    }
                }
                $setCookie("retcode", ncookie.join("|"), 60, "/", this.domain);
                if (!ret) {
                    return;
                }
                this.sTime = new Date(parseInt(ret[1]));
            }
            if (!this.url) {
                return;
            }

            var domain = this.url.replace(/^.*\/\//, '').replace(/\/.*/, ''),
                timer = this.eTime - this.sTime,
                cgi = encodeURIComponent(this.formatUrl ? this.url.match(/^[\w|/|.|:|-]*/)[0] : this.url);
            this.reportUrl = "http://c.isdspeed.qq.com/code.cgi?domain=" + domain + "&cgi=" + cgi + "&type=" + this.retCode + "&code=" + this.errCode + "&time=" + timer + "&rate=" + this.frequence + (this.uin ? ("&uin=" + this.uin) : "");

            //采样判断
            if (this.reportUrl && Math.random() < (1 / this.frequence) && this.url) {
                $report(this.reportUrl);
            }
            /*if(errid!=option.timeoutCode){
    			setScriptState();
    		}*/
        }

        /*function setScriptState(){
    		var scripts = document.getElementsByTagName("head")[0].getElementsByTagName("script");
    		for(var i=0,j=scripts.length;i<j;i++){
    			if(scripts[i].src.indexOf(option.url)==0){//找到当前调用的cgi，需要确保option.url尽可能的完整
    				scripts[i].setAttribute("callbackHasBeenCallled","true");
    				return ;
    			}
    		}
    	}*/

        return option;
    };

    function $setCookie(name, value, expires, path, domain, secure) {
        //写入COOKIES
        var exp = new Date(),
            expires = arguments[2] || null,
            path = arguments[3] || "/",
            domain = arguments[4] || null,
            secure = arguments[5] || false;
        expires ? exp.setMinutes(exp.getMinutes() + parseInt(expires)) : "";
        document.cookie = name + '=' + escape(value) + (expires ? ';expires=' + exp.toGMTString() : '') + (path ? ';path=' + path : '') + (domain ? ';domain=' + domain : '') + (secure ? ';secure' : '');
    };

    function $time33(str) {
        //哈希time33算法
        for (var i = 0, len = str.length, hash = 5381; i < len; ++i) {
            hash += (hash << 5) + str.charAt(i).charCodeAt();
        };
        return hash & 0x7fffffff;
    }
});