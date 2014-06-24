define('validator', function(require, module, exports) {
	function validator(settings) {
		var _settings = extend({
			//错误提示模板
			msgTemplate: '<span class="msg-para-warn re_ibx" style="margin:0px;"><span class="msg0-icon-warn"></span>{#msg#}</span>',
			//属性
			valiTag: 'vali',
			//校验规则池
			rules: {
				"require": function(domObj, valiItem, retObj) {
					if ((domObj.value.replace(/^\s*|\s*$/g, '')) === '') {
						retObj.code = -1;
						retObj.msg = valiItem.caption + '不能为空';
					}
					return retObj;
				},
				"length": function(domObj, valiItem, retObj) {
					var min = valiItem.min,
						max = valiItem.max,
						//是否区分中英文
						isGb = valiItem.isGb,
						caption = valiItem.caption,
						unit = valiItem.unit,
						v = domObj.value;

					if (v !== '') {
						//如果区分中英文，将上下限转成字节数
						var _min = min,
							_max = max;
						if (isGb) {
							_min = min * 2;
							_max = max * 2;
						}
						if (_min && ((isGb ? strLenGB(v) : v.length) < _min)) {
							retObj.code = -1;
							retObj.msg = valiItem.caption + '长度不能小于' + min + unit;
						} else if (_max && ((isGb ? strLenGB(v) : v.length) > _max)) {
							retObj.code = -1;
							retObj.msg = valiItem.caption + '长度不能大于' + max + unit;
						}
					}
					return retObj;
				},
				"float": function(domObj, valiItem, retObj) {
					var caption = valiItem.caption,
						unit = valiItem.unit,
						v = domObj.value,
						decimalNum = valiItem.decimalNum || 2;

					//默认保留两位小数
					var reg = decimalNum == 2 ? (/^[1-9]?\d+(\.\d{1,2})?$/) : new RegExp('^[1-9]?\\d+(\\.\\d{1,' + decimalNum + '})?$');

					//输入的值如果为空不进行校验
					if (v !== '' && !reg.test(v)) {
						retObj.code = -1;
						retObj.msg = '输入的' + caption + '格式不正确（小数部分不超过' + decimalNum + '位）';
					}
					return retObj;
				},
				"range": function(domObj, valiItem, retObj) {
					var min = valiItem.min,
						max = valiItem.max,
						caption = valiItem.caption,
						unit = valiItem.unit,
						v = parseFloat(domObj.value);

					if (min && (v < min)) {
						retObj.code = -1;
						retObj.msg = caption + '不能小于' + min + unit;
					} else if (max && (v > max)) {
						retObj.code = -1;
						retObj.msg = caption + '不能大于' + max + unit;
					}
					return retObj;
				},
				"int": /^\d{1,}$/,
				"price": /^[1-9]?\d+(\.\d{1,2})?$/,
				"email": /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/,
				"cellphone": /^(?:13|15|18)\d{9}$/,
				"phone": /^(0[0-9]{2,3}\-)?([2-9][0-9]{6,7})+(\-[0-9]{1,5})?$/,
				"zip": /^[0-9]\d{5}$/,
				"qq": /^[1-9]\d{4,9}$/,
				"cmdtyid": /^[0-9A-F]{32}$/i
			},
			//绑定的校验对象
			valiItems: {},
			//全局事件
			//成功事件
			success: function(domObj, retObj, valiItem) {
				var msgObj = get(valiItem.msgId);
				if (msgObj) {
					msgObj.innerHTML = '';
					msgObj.style.display = 'none';
				}
			},
			//失败事件
			error: function(domObj, retObj, valiItem) {
				var msgObj = get(valiItem.msgId);
				if (!valiItem.msgId) {
					msgObj = document.createElement('DIV');
					msgObj.id = domObj.id + 'AutoMsg';
					valiItem.msgId = msgObj.id;
					document.body.appendChild(msgObj);
					msgObj.setAttribute('auto', '1');
				}

				if (!msgObj) return;

				msgObj.innerHTML = _settings.msgTemplate.replace(/{#msg#}/g, retObj.msg);
				msgObj.style.display = '';

				if (msgObj.getAttribute('auto') === '1') {
					var left, top;
					if (valiItem.tipspos === 'top') {
						left = $getX(domObj);
						top = $getY(domObj) - $getHeight(domObj) - 5;
					} else if (valiItem.tipspos === 'bottom') {
						left = $getX(domObj);
						top = $getY(domObj) + $getHeight(domObj) + 5;
					} else {
						left = $getX(domObj) + $getWidth(domObj) + 5;
						top = $getY(domObj);
					}
					msgObj.style.cssText = 'position:absolute;left:' + left + 'px;top:' + top + 'px;';
				}
			}
		}, settings);

		function strLenGB(v) {
			//一个中文按照两个字节算，返回长度
			return v.replace(/[\u0080-\uFFFF]/g, "  ").length;
		}

		function addEvent(obj, type, handle) {
			if (window.addEventListener) {
				var wrapper = createDelegate(handle, obj);
				obj.addEventListener(type, wrapper, false);
			} else if (window.attachEvent) {
				var wrapper = createDelegate(handle, obj);
				obj.attachEvent("on" + type, wrapper);
			} else {
				obj["on" + type] = handle;
			}
		}

		function createDelegate(handle, context) {
			return function() {
				return handle.apply(context, arguments);
			};
		}

		function extend(srcObj, targetObj) {
			for (var key in targetObj) {
				var v = targetObj[key];
				if (v !== null && v !== undefined) {
					srcObj[key] = v;
				}
			}
			return srcObj;
		}

		function get(id) {
			if (typeof id === 'string')
				return document.getElementById(id);
			else
				return id;
		}

		/*
    校验对象
    */

		function valiItem(domObj) {
			var valiItem = _settings.valiItems[domObj.id],
				valiTypes,
				rule,
				retObj = {
					code: 0,
					msg: ''
				};

			//已经注册过验证的dom组件，并且验证状态为true的情况下进行验证
			if (valiItem && valiItem.getValiState(domObj)) {
				valiTypes = valiItem.valiType.replace(/\s+/g, '').split(',');
				for (var i = 0; i < valiTypes.length; i++) {
					retObj = {
						code: 0,
						msg: ''
					};
					rule = _settings.rules[valiTypes[i]];
					if (rule) {
						checkRule(domObj, rule, valiItem, retObj);
						//验证失败，跳出循环
						if (retObj.code !== 0) break;
					}
				}
			}

			if (retObj.code === 0) {
				_settings.success(domObj, retObj, valiItem);
			} else {
				_settings.error(domObj, retObj, valiItem);
			}

			return retObj;
		}


		function checkRule(domObj, rule, valiItem, retObj) {
			var result;
			if (Object.prototype.toString.call(rule) === '[object RegExp]') {
				//正则
				result = rule.test(domObj.value);
				if (domObj.value !== '' && !result) {
					retObj.code = -1;
					retObj.msg = '请输入正确的' + valiItem.caption;
				}
			} else {
				//函数
				rule(domObj, valiItem, retObj);
			}

			return retObj;
		}

		function scrollToItem(domObj) {
			var objY = $getY(domObj),
				top = $getPageScrollHeight(),
				bottom = top + $getWindowHeight();
			if (objY < top) {
				setTimeout(function() {
						window.scrollTo(0, objY - 80)
					},
					0);
			} else if (objY > bottom - 50) {
				setTimeout(function() {
						window.scrollTo(0, objY + 120 + top - bottom)
					},
					0);
			}
		}

		return {
			bind: function(valiOpt) {
				var _valiOpt = extend({
						domId: '', //需要校验的dom元素ID
						eventType: 'blur', //触发验证的事件类型
						msgId: '', //错误提示的dom id（不填写则自动创建）
						valiType: '', //校验类型
						min: 0, //允许的最小值
						max: null, //允许的最大值
						isGb: 0, //中文算两个长度为1，按字节长度为0
						caption: '', //错误提示的主语
						unit: '', //数量单位
						//获取校验开关状态，校验开返回true，校验关返回false
						getValiState: function() {
							return true;
						},
						tipspos: 'right' //right|top|bottom
					}, valiOpt),
					me = this;

				var domObj = get(_valiOpt.domId);

				//绑定触发事件
				addEvent(domObj, _valiOpt.eventType, function() {
					me.doVali(this);
				});

				//设置已绑定校验标记
				domObj.setAttribute('attr-vali', _settings.valiTag);

				//如果对象没有设置id，则自动生成一个
				if (!domObj.id) domObj.id = domObj.tagName + '_' + Math.random();

				//记录校验规则
				_settings.valiItems[domObj.id] = _valiOpt;
			},
			/*添加规则
        {name: '', rule: (regex,function)}
        */
			addRules: function(rules) {
				if (rules) {
					if (Object.prototype.toString.call(rules) === "[object Array]") {

					} else {
						rules = [rules];
					}

					for (var i = 0; i < rules.length; i++) {
						_settings.rules[rules[i].name] = rules[i].rule;
					}
				}
			},
			//校验单个元素
			doVali: function(domId, noScroll) {
				var domObj = get(domId);
				retObj = valiItem(domObj);
				if (retObj.code !== 0 && !noScroll) {
					setTimeout(function() {
						scrollToItem(domObj);
					}, 100);
				}
			},
			//批量校验所有绑定元素
			batchVali: function(isbreak) {
				var result = true,
					hasScroll = false;
				for (var key in _settings.valiItems) {
					var domObj = get(key);

					if (!domObj) {
						delete _settings.valiItems[key];
					} else {
						retObj = valiItem(domObj);
						if (retObj.code !== 0) {
							result = false;
							if (!hasScroll && !domObj.noscroll) {
								hasScroll = true;
								scrollToItem(domObj);
							}
							if (isbreak) {
								break;
							}
						}
					}
				}
				return result;
			}
		}
	}

	function $getHeight(e) {
		var show = e.style.display;
		show == "none" && (e.style.display = "");
		var box = e.getBoundingClientRect();
		var h = box.height ? box.height : (box.bottom - box.top);
		e.style.display = show;
		return h;
	};

	function $getPageScrollHeight() {
		var bodyCath = document.body;
		var doeCath = document.compatMode == 'BackCompat' ? bodyCath : document.documentElement;
		var ua = navigator.userAgent.toLowerCase();
		return (window.MessageEvent && ua.indexOf('firefox') == -1 && ua.indexOf('opera') == -1 && ua.indexOf('msie') == -1) ? bodyCath.scrollTop : doeCath.scrollTop;
	};

	function $getWidth(e) {
		var box = e.getBoundingClientRect();
		return box.width ? box.width : (box.right - box.left);
	};

	function $getWindowHeight() {
		var bodyCath = document.body;
		return (document.compatMode == 'BackCompat' ? bodyCath : document.documentElement).clientHeight;
	};

	function $getX(e) {
		//获取页面中对象的绝对X位置
		var t = e.offsetLeft || 0;
		while (e = e.offsetParent) t += e.offsetLeft;
		return t;
	};

	function $getY(e) {
		//获取页面中对象的绝对Y位置
		var t = e.offsetTop || 0;
		while (e = e.offsetParent) {
			t += e.offsetTop;
		}
		return t;
	}

	exports.init = function(opt) {
		return new validator(opt);
	}
});