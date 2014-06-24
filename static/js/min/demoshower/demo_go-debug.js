define("demoshower/demo_go-debug", [], function(require, exports, module) {
    // 对外提供接口
    module.exports = {
        name: "a",
        doSomething: function() {
            alert(2);
        }
    };
});
