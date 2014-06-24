define('calendar', function(require, module, exports) {
    function $jqCalendar() {
        var jQuery = window['jQuery'];
        (function($) { // create private scope (inside you can use $ instead of jQuery)

            // functions and vars declared here are effectively 'singletons'.  there will be only a single
            // instance of them.  so this is a good place to declare any immutable items or stateless
            // functions.  for example:

            var today = new Date(); // used in defaults
            var months = '一月,二月,三月,四月,五月,六月,七月,八月,九月,十月,十一月,十二月'.split(',');
            var monthlengths = '31,28,31,30,31,30,31,31,30,31,30,31'.split(',');
            var yearRegEx = /^\d{4,4}$/;

            // next, declare the plugin function
            $.fn.simpleDatepicker = function(options) {
                // functions and vars declared here are created each time your plugn function is invoked

                // you could probably refactor your 'build', 'load_month', etc, functions to be passed
                // the DOM element from below

                var opts = jQuery.extend({}, jQuery.fn.simpleDatepicker.defaults, options);

                // replaces a date string with a date object in opts.startdate and opts.enddate, if one exists
                // populates two new properties with a ready-to-use year: opts.startyear and opts.endyear
                /** extracts and setup a valid year range from the opts object **/
                (function setupYearRange() {
                    var startyear, endyear;
                    if (opts.startdate.constructor == Date) {
                        startyear = opts.startdate.getFullYear();
                    } else if (opts.startdate) {
                        if (yearRegEx.test(opts.startdate)) {
                            startyear = opts.startdate;
                        } else if (opts.startdate) {
                            opts.startdate = initDateObj(opts.startdate);
                            startyear = opts.startdate.getFullYear();
                        } else {
                            startyear = today.getFullYear();
                        }
                    } else {
                        startyear = today.getFullYear();
                    }
                    opts.startyear = startyear;

                    if (opts.enddate.constructor == Date) {
                        endyear = opts.enddate.getFullYear();
                    } else if (opts.enddate) {
                        if (yearRegEx.test(opts.enddate)) {
                            endyear = opts.enddate;
                        } else if (opts.enddate) {
                            opts.enddate = initDateObj(opts.enddate);
                            endyear = opts.enddate.getFullYear();
                        } else {
                            endyear = today.getFullYear();
                        }
                    } else {
                        endyear = today.getFullYear();
                    }
                    opts.endyear = endyear;
                })();

                /** HTML factory for the actual datepicker table element **/
                // has to read the year range so it can setup the correct years in our HTML <select>
                function newDatepickerHTML() {
                    var years = [];

                    // process year range into an array
                    for (var i = 0; i <= opts.endyear - opts.startyear; i++) years[i] = opts.startyear + i;

                    // build the table structure
                    var div = jQuery('<div attrTag="jqCalendar_datepicker" class="datepicker" style="display:none;z-index:300;"><table cellpadding="0" cellspacing="0"><tbody></tbody></table><iframe class="ifhideselect" frameborder="0"></iframe></div>');
                    var table = div.find('table');

                    table.append('<thead class="datepicker_head"></thead>');
                    table.append('<tfoot class="datepicker_foot"></tfoot>');

                    // month select field
                    var monthselect = '<select name="month">';
                    for (var i in months) monthselect += '<option value="' + i + '">' + months[i] + '</option>';
                    monthselect += '</select>';

                    // year select field
                    var yearselect = '<select name="year">';
                    for (var i in years) yearselect += '<option>' + years[i] + '</option>';
                    yearselect += '</select>';

                    jQuery("thead", table).append('<tr class="controls"><th colspan="7"><span class="prevMonth"><</span> ' + monthselect + yearselect + ' <span class="nextMonth">></span></th></tr><tr class="days"><th>S</th><th>M</th><th>T</th><th>W</th><th>T</th><th>F</th><th>S</th></tr>');
                    var foot = jQuery("tfoot", table);
                    if (opts.hasTime) {
                        var footStr = '<tr><td colspan=7><select name="hour">' + fillTimeOption(24) + '</select>时 <select name="minute">' + fillTimeOption(60) + '</select>分 ';
                        if (opts.timeFormat.indexOf('ss') > 0) {
                            footStr += '<select name="second">' + fillTimeOption(60) + '</select>秒 </td></tr>';
                        } else {
                            footStr += '</td></tr>';
                        }
                        foot.append(footStr);
                    }
                    foot.append('<tr><td colspan="2"><span class="clear">清空</span></td><td colspan="3"><span class="today">今天</span></td><td colspan="2"><span class="datepicker_close">关闭</span></td></tr>');
                    for (var i = 0; i < 6; i++) jQuery("tbody", table).append('<tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>');
                    return div;

                    function fillTimeOption(num) {
                        var a = [];
                        for (var i = 0; i < num; i++) {
                            var v = (i) < 10 ? ('0' + (i)) : (i);
                            a.push('<option value="' + v + '">' + v + '</option>');
                        }
                        return a.join('');
                    }
                }

                /** get the real position of the input (well, anything really) **/
                //http://www.quirksmode.org/js/findpos.html
                function findPosition(obj) {
                    var curleft = curtop = 0;
                    if (obj.offsetParent) {
                        do {
                            curleft += obj.offsetLeft;
                            curtop += obj.offsetTop;
                        } while (obj = obj.offsetParent);
                        return [curleft, curtop];
                    } else {
                        return false;
                    }
                }

                /** load the initial date and handle all date-navigation **/
                // initial calendar load (e is null)
                // prevMonth & nextMonth buttons
                // onchange for the select fields
                function loadMonth(e, el, datepicker, chosendate) {
                    // reference our years for the nextMonth and prevMonth buttons
                    var mo = jQuery("select[name=month]", datepicker).get(0).selectedIndex;
                    var yr = jQuery("select[name=year]", datepicker).get(0).selectedIndex;
                    var yrs = jQuery("select[name=year] option", datepicker).get().length;

                    // first try to process buttons that may change the month we're on
                    if (e && jQuery(e.target).hasClass('prevMonth')) {
                        if (0 == mo && yr) {
                            yr -= 1;
                            mo = 11;
                            jQuery("select[name=month]", datepicker).get(0).selectedIndex = 11;
                            jQuery("select[name=year]", datepicker).get(0).selectedIndex = yr;
                        } else {
                            mo -= 1;
                            jQuery("select[name=month]", datepicker).get(0).selectedIndex = mo;
                        }
                    } else if (e && jQuery(e.target).hasClass('nextMonth')) {
                        if (11 == mo && yr + 1 < yrs) {
                            yr += 1;
                            mo = 0;
                            jQuery("select[name=month]", datepicker).get(0).selectedIndex = 0;
                            jQuery("select[name=year]", datepicker).get(0).selectedIndex = yr;
                        } else {
                            mo += 1;
                            jQuery("select[name=month]", datepicker).get(0).selectedIndex = mo;
                        }
                    }

                    // maybe hide buttons
                    if (0 == mo && !yr) jQuery("span.prevMonth", datepicker).hide();
                    else jQuery("span.prevMonth", datepicker).show();
                    if (yr + 1 == yrs && 11 == mo) jQuery("span.nextMonth", datepicker).hide();
                    else jQuery("span.nextMonth", datepicker).show();

                    // clear the old cells
                    var cells = jQuery("tbody td", datepicker).unbind().empty().removeClass('date');

                    // figure out what month and year to load
                    var m = jQuery("select[name=month]", datepicker).val();
                    var y = jQuery("select[name=year]", datepicker).val();
                    var d = new Date(y, m, 1);
                    var startindex = d.getDay();
                    var numdays = monthlengths[m];

                    // http://en.wikipedia.org/wiki/Leap_year
                    if (1 == m && ((y % 4 == 0 && y % 100 != 0) || y % 400 == 0)) numdays = 29;

                    // test for end dates (instead of just a year range)
                    if (opts.startdate.constructor == Date) {
                        var startMonth = opts.startdate.getMonth();
                        var startDate = opts.startdate.getDate();
                    }
                    if (opts.enddate.constructor == Date) {
                        var endMonth = opts.enddate.getMonth();
                        var endDate = opts.enddate.getDate();
                    }

                    // walk through the index and populate each cell, binding events too
                    for (var i = 0; i < numdays; i++) {

                        var cell = jQuery(cells.get(i + startindex)).removeClass('chosen');

                        // test that the date falls within a range, if we have a range
                        if (
                            (yr || ((!startDate && !startMonth) || ((i + 1 >= startDate && mo == startMonth) || mo > startMonth))) &&
                            (yr + 1 < yrs || ((!endDate && !endMonth) || ((i + 1 <= endDate && mo == endMonth) || mo < endMonth)))) {

                            cell
                                .text(i + 1)
                                .addClass('date')
                                .hover(
                                    function() {
                                        jQuery(this).addClass('over');
                                    },
                                    function() {
                                        jQuery(this).removeClass('over');
                                    })
                                .click(function() {
                                    var chosenDateObj = new Date(jQuery("select[name=year]", datepicker).val(), jQuery("select[name=month]", datepicker).val(), jQuery(this).text(), jQuery("select[name=hour]", datepicker).val() || 0, jQuery("select[name=minute]", datepicker).val() || 0, jQuery("select[name=second]", datepicker).val() || 0);
                                    closeIt(el, datepicker, chosenDateObj);
                                });

                            // highlight the previous chosen date
                            if (i + 1 == chosendate.getDate() && m == chosendate.getMonth() && y == chosendate.getFullYear()) cell.addClass('chosen');
                        }
                    }
                }

                /** closes the datepicker **/
                // sets the currently matched input element's value to the date, if one is available
                // remove the table element from the DOM
                // indicate that there is no datepicker for the currently matched input element
                function closeIt(el, datepicker, dateObj, isClear) {
                    if (dateObj && dateObj.constructor == Date) {
                        el.val(jQuery.fn.simpleDatepicker.formatOutput(dateObj, opts));
                    }
                    if (isClear) {
                        el.val('');
                    }
                    datepicker.remove();
                    datepicker = null;
                    jQuery.data(el.get(0), "simpleDatepicker", {
                        hasDatepicker: false
                    });
                    opts.callback(el.get(0));
                }

                function initDateObj(str) {
                    try {
                        var a1 = str.split(' ');
                        var ds = a1[0].split(/-|\//g);
                        var ts = a1[1] ? a1[1].split(':') : [];

                        return new Date(ds[0], parseInt(ds[1] - 1), ds[2], ts[0] || null, ts[1] || null, ts[2] || null);
                    } catch (e) {
                        return new Date();
                    }
                };

                // iterate the matched nodeset
                return this.each(function() {

                    // functions and vars declared here are created for each matched element. so if
                    // your functions need to manage or access per-node state you can defined them
                    // here and use me to get at the DOM element

                    if (jQuery(this).is('input') && 'text' == jQuery(this).attr('type')) {

                        var datepicker;
                        jQuery.data(jQuery(this).get(0), "simpleDatepicker", {
                            hasDatepicker: false
                        });

                        // open a datepicker on the click event
                        jQuery(this).click(function(ev) {
                            var me = jQuery(ev.target);
                            if (false == jQuery.data(me.get(0), "simpleDatepicker").hasDatepicker) {
                                var curDatepicker = $jqCalendar.datepicker;
                                if (curDatepicker) {
                                    curDatepicker.unbind();
                                    curDatepicker.remove();
                                    curDatepicker = null;
                                    jQuery.data($jqCalendar.el, "simpleDatepicker", {
                                        hasDatepicker: false
                                    });
                                }
                                // store data telling us there is already a datepicker
                                jQuery.data(me.get(0), "simpleDatepicker", {
                                    hasDatepicker: true
                                });

                                // validate the form's initial content for a date
                                var initialDate = me.val();

                                if (initialDate) {
                                    var chosendate = initDateObj(initialDate);
                                } else if (opts.chosendate.constructor == Date) {
                                    var chosendate = opts.chosendate;
                                } else if (opts.chosendate) {
                                    var chosendate = initDateObj(opts.chosendate);
                                } else {
                                    var chosendate = today;
                                }

                                // insert the datepicker in the DOM
                                datepicker = newDatepickerHTML();
                                jQuery("body").prepend(datepicker);

                                // position the datepicker
                                var elPos = findPosition(me.get(0));
                                var x = (parseInt(opts.x) ? parseInt(opts.x) : 0) + elPos[0];
                                var y = (parseInt(opts.y) ? parseInt(opts.y) : 0) + elPos[1];
                                jQuery(datepicker).css({
                                    position: 'absolute',
                                    left: x,
                                    top: y,
                                    display: ''
                                });

                                // bind events to the table controls
                                jQuery("span", datepicker).css("cursor", "pointer");
                                jQuery("select", datepicker).bind('change', function() {
                                    loadMonth(null, me, datepicker, chosendate);
                                }).click(function() {
                                    return false;
                                });
                                jQuery("span.prevMonth", datepicker).click(function(e) {
                                    loadMonth(e, me, datepicker, chosendate);
                                    return false;
                                });
                                jQuery("span.nextMonth", datepicker).click(function(e) {
                                    loadMonth(e, me, datepicker, chosendate);
                                    return false;
                                });
                                jQuery("span.today", datepicker).click(function() {
                                    closeIt(me, datepicker, new Date());
                                });
                                jQuery("span.datepicker_close", datepicker).click(function() {
                                    closeIt(me, datepicker);
                                });
                                jQuery("span.clear", datepicker).click(function() {
                                    closeIt(me, datepicker, null, true);
                                });
                                // set the initial values for the month and year select fields
                                // and load the first month
                                jQuery("select[name=month]", datepicker).get(0).selectedIndex = chosendate.getMonth();
                                jQuery("select[name=year]", datepicker).get(0).selectedIndex = Math.max(0, chosendate.getFullYear() - opts.startyear);

                                if (opts.hasTime) {
                                    jQuery("select[name=hour]", datepicker).get(0).selectedIndex = chosendate.getHours();
                                    jQuery("select[name=minute]", datepicker).get(0).selectedIndex = chosendate.getMinutes();
                                    if (opts.timeFormat.indexOf('ss') > 0) {
                                        jQuery("select[name=second]", datepicker).get(0).selectedIndex = chosendate.getSeconds();
                                    }
                                }
                                loadMonth(null, me, datepicker, chosendate);
                            }
                            $jqCalendar.datepicker = datepicker;
                            $jqCalendar.el = me.get(0);
                            $jqCalendar.showCalendar = true;
                            opts.onShow && opts.onShow(me, datepicker);
                            return false;
                        });

                        jQuery(document.body).click(function() {
                            if (!$jqCalendar.showCalendar) {
                                var curDatepicker = $jqCalendar.datepicker;
                                if (curDatepicker) {
                                    curDatepicker.unbind();
                                    curDatepicker.remove();
                                    curDatepicker = null;
                                    jQuery.data($jqCalendar.el, "simpleDatepicker", {
                                        hasDatepicker: false
                                    });
                                }
                            }
                            $jqCalendar.showCalendar = false;
                        });
                    }

                });

            };

            // finally, I like to expose default plugin options as public so they can be manipulated.  one
            // way to do this is to add a property to the already-public plugin fn

            jQuery.fn.simpleDatepicker.formatOutput = function(dateObj, opts) {
                return fixedValue(dateObj.getFullYear()) + '-' + fixedValue(dateObj.getMonth() + 1) + "-" + fixedValue(dateObj.getDate()) + (opts.hasTime ? (' ' + opts.timeFormat.replace('hh', fixedValue(dateObj.getHours())).replace('ii', fixedValue(dateObj.getMinutes())).replace('ss', fixedValue(dateObj.getSeconds()))) : '');

                function fixedValue(v) {
                    return v < 10 ? ('0' + v) : v;
                }
            };

            jQuery.fn.simpleDatepicker.defaults = {
                // date string matching /^\d{1,2}\/\d{1,2}\/\d{2}|\d{4}$/
                chosendate: today,
                // date string matching /^\d{1,2}\/\d{1,2}\/\d{2}|\d{4}$/
                // or four digit year
                startdate: today.getFullYear() - 20,
                enddate: today.getFullYear() + 30,
                timeFormat: 'hh:ii', //hh:ii:ss
                hasTime: false,
                // offset from the top left corner of the input element
                x: 18, // must be in px
                y: 18, // must be in px
                callback: function(datepicker) {}
            };

            $loadCss("http://static.paipaiimg.com/module/jqcalendar.css?t=20130718");
        })(jQuery);
    }

    function $loadCss(path, callback) {
        if (!path) {
            return;
        }
        var l;
        if (!window["_loadCss"] || window["_loadCss"].indexOf(path) < 0) {
            l = document.createElement('link');
            l.setAttribute('type', 'text/css');
            l.setAttribute('rel', 'stylesheet');
            l.setAttribute('href', path);
            l.setAttribute("id", "loadCss" + Math.random());
            document.getElementsByTagName("head")[0].appendChild(l);
            window["_loadCss"] ? (window["_loadCss"] += "|" + path) : (window["_loadCss"] = "|" + path);
        }

        l && (typeof callback == "function") && (l.onload = callback);

        return true;
    }
});