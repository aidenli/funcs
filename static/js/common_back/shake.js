/**
 * 终端摇一摇模块，使用前先判断终端设备是否支持摇一摇功能，然后再做差异化的体验
 * @class shake
 * @module global
 * @author chauvetxiao
 * @date 20130905
 */
define("shake", function(require, exports, module) {
    var SHAKE_THRESHOLD = 1200;
    var last_update = 0;
    var frequency = 200;
    var x, y, z, last_x, last_y, last_z, callback;

    var _isMotionAble = !!window.DeviceMotionEvent; //判断是否支持加速度传感器

    /**
     * 初始化摇一摇的方法
     * @method init
     * @param {Function} fn 设备摇一摇后的回调方法
     * @param {Number} [frequency:200] 检测摇一摇的时间间隔
     */
    var _init = function(fn, freq) {
        if (_isMotionAble) {
            window.addEventListener("devicemotion", _deviceMotionHandler, false);
            callback = fn;
            x = y = z = last_x = last_y = last_z = 0;
            frequency = freq || frequency;
        }
    };

    /**
     * 设备旋转后的回调方法
     * @method _deviceMotionHandler
     * @private
     * @param {Event} eventData 事件对象
     */
    var _deviceMotionHandler = function(eventData) {
        var acceleration = eventData.accelerationIncludingGravity;

        var curTime = +new Date;

        if (curTime - last_update > frequency) {

            var diffTime = curTime - last_update;
            last_update = curTime;

            x = acceleration.x;
            y = acceleration.y;
            z = acceleration.z;

            var speed = Math.abs(x + y + z - last_x - last_y - last_z) / diffTime * 10000;

            if (speed > SHAKE_THRESHOLD) {
                callback && callback();
            }
            last_x = x;
            last_y = y;
            last_z = z;
        }
    }

    return {
        /**
         * 设备是否支持摇一摇功能
         * @property isShakeAble
         * @type Boolean
         */
        isShakeAble: _isMotionAble,
        init: _init
    }
});