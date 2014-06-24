/**
 * 按需加载组件
 * 用于长列表分页加载，具有返回定位，dom节点回收功能
 */
define('demandLoad', function(require, exports, module) {
    var $ = require('mobile.zepto'),
        fj = require('formatJson'),
        scrollCtrl = require('wg.scrollCtrl');

    function demandLoad(opt) {
        !demandLoad.guid && (demandLoad.guid = 100);
        demandLoad.guid++;

        var _opt = $.extend({
                minpageno: 1,
                pageno: 1,
                pagesize: 20,
                total: 0,
                preHeight: 0,
                isLast: null,
                hasFirst: null,
                domObj: null,
                tmplId: null,
                isDeleteNode: true,
                siblingPageNum: 99,
                initScrollTop: 0,
                IloadData: null,
                timeout: 5000
            }, opt),
            me = this,
            _contentPrefix = 'datapage' + demandLoad.guid + '_',
            _tmpl,
            _scrCtrl,
            _tempUp,
            _upLine,
            _downLine,
            _maxPageno,
            _loadingTag;

        typeof _opt.domObj === 'string' ? (_opt.domObj = $('#' + _opt.domObj)) : '';

        // 计算dom相关数据
        this.calcDom = function() {
            _opt.hasFirst = (_opt.pageno === 1);
            //_opt.isLast = checkIsLast(_opt.pageno);
            _upPageno = _opt.pageno;
        }

        // 初始化页面结构
        this.initPageStructor = function() {
            _tempUp = createDom('DIV', '_tempUp' + demandLoad.guid);
            _upLine = createDom('DIV', '_upLine' + demandLoad.guid);
            _downLine = createDom('DIV', '_downLine' + demandLoad.guid);
            _opt.domObj.before(_tempUp);
            _opt.domObj.before(_upLine);
            _opt.domObj.after(_downLine);
            _tempUp = $('#_tempUp' + demandLoad.guid);
            _upLine = $('#_upLine' + demandLoad.guid);
            _downLine = $('#_downLine' + demandLoad.guid);
            _tempUp.css('height', (_opt.pageno - 1) * _opt.pagesize * _opt.preHeight);

            _tmpl = $('#' + _opt.tmplId).html();

            _scrCtrl = scrollCtrl.init();
        }

        this.renderData = function(datas, pageno, loadtype, total) {
            var pagesize = _opt.pagesize,
                begin = (pageno - 1) * pagesize,
                end = pageno * pagesize,
                contentStr,
                contentId,
                contentObj;

            if (datas.length === 0) return false;

            _opt.total = total;
            // 判断该页是否为最后一页
            _opt.isLast = checkIsLast(pageno);

            datas.pageno = pageno;
            datas.pagesize = pagesize;

            contentId = _contentPrefix + pageno;

            contentStr = fj.formatJson(_tmpl, {
                data: datas
            });

            contentObj = $('#' + contentId);
            if (contentObj.length > 0) {
                contentObj.html(contentStr);
            } else {
                contentStr = '<div id="' + contentId + '">' + contentStr + '</div>';
                loadtype === 'next' ? _opt.domObj.append(contentStr) : _opt.domObj.prepend(contentStr);
                contentObj = $('#' + contentId);
            }

            if (_opt.initScrollTop !== null) {
                window.scrollTo(0, _opt.initScrollTop);
                _opt.initScrollTop = null;
            }

            // 滚动加载图片
            _scrCtrl.on(contentObj.find('img[init_src]'), function(obj) {
                var imgUrl = this.getAttribute('init_src');
                if (imgUrl) {
                    this.src = imgUrl;
                    this.removeAttribute('init_src');
                }
            });
            setTimeout(function() {
                initDownBorder();
                initUpBorder();
                clearDoms(pageno);
            }, 500);
        }

        this.next = function() {
            if (_maxPageno >= (_opt.pageno + 1)) {
                ++_opt.pageno;
                _opt.IloadData && _opt.IloadData.apply(this, [_opt.pageno, _opt.pagesize, 'next']);
                //log('render next page:' + _opt.pageno);
            }
        }

        this.prev = function() {
            var pageno = _upPageno - 1;
            //log('_upPageno: ' + pageno);
            if (pageno >= _opt.minpageno) {
                _opt.IloadData && _opt.IloadData.apply(this, [pageno, _opt.pagesize, 'prev']);
                --_upPageno;
                //log('render prev page:' + --_upPageno);
            }
        }

        this.reset = function(opt) {
            _opt = $.extend(_opt, {
                pageno: _opt.minpageno,
                pagesize: 20
            }, opt);

            _scrCtrl.clear();
            _scrCtrl = null;

            _opt.domObj.html('');

            _tempUp.remove();
            _upLine.remove();
            _downLine.remove();

            this.init();
        }

        function clearDoms(pageno) {
            if (_opt.isDeleteNode) {
                var prevno = pageno - _opt.siblingPageNum,
                    nextno = pageno + _opt.siblingPageNum;
                if (prevno > 0) {
                    var contentObj = $('#' + _contentPrefix + prevno),
                        lis = $('#' + _contentPrefix + prevno).find('li[attr-pageno="' + prevno + '"]');
                    if (lis.length > 0) {
                        //log('remove:' + prevno);
                        contentObj.html('');
                        _tempUp.css('height', prevno * _opt.pagesize * _opt.preHeight);
                        _upPageno = prevno + 1;

                        //log('clear doms, the new up pageno is :' + _upPageno);
                    }
                }

                if (nextno > 0) {
                    var contentObj = $('#' + _contentPrefix + nextno),
                        lis = contentObj.find('li[attr-pageno="' + nextno + '"]');
                    if (lis.length > 0) {
                        //log('remove:' + nextno);
                        contentObj.html('');
                        _opt.pageno = nextno - 1;
                        //log('clear doms, the new next pageno is :' + _opt.pageno);

                        _maxPageno = (Math.ceil(_opt.total / _opt.pagesize)).toFixed(0) * 1;
                        //_downLine.html('<div class="wx_loading2"><i class="wx_loading_icon"></i></div>');
                    }
                }
            }
        }

        function initDownBorder() {
            _scrCtrl.on(_downLine[0], function(obj) {
                if (!_opt.isLast) {
                    me.next();
                }
            });
        }

        function initUpBorder() {
            _scrCtrl.on(_upLine[0], 'beforeTop', function(obj) {
                me.prev();
                _tempUp.css('height', (_upPageno - 1) * _opt.pagesize * _opt.preHeight);
            });
        }

        function checkIsLast(pageno) {
            _maxPageno = (Math.ceil(_opt.total / _opt.pagesize)).toFixed(0) * 1;
            var isLast = _maxPageno === pageno;

            if (isLast) {
                //_downLine.html('');
            }

            return isLast;
        }

        function createDom(tag, id) {
            var dom = document.createElement(tag);
            dom.id = id;
            return dom;
        }

        function log(msg) {
            //console.log(msg);
            //logDiv.innerHTML += msg + '<br />';
            //logDiv.scrollTo(0, 9999);
        }

        this.init = function() {
            this.initPageStructor();
            this.calcDom();
            _opt.IloadData && _opt.IloadData.apply(this, [_opt.pageno, _opt.pagesize, 'next']);
        }

        this.init();
    }

    exports.init = function(opt) {
        return new demandLoad(opt);
    }
});