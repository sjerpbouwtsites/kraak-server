(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = {
        stop(statsWorker) {
            statsWorker.berichtAanWorker({
                type: 'stop'
            });
            statsWorker.on('message', function (bericht) {
                if (bericht.type === 'status') {
                    if (bericht.data === 'dood') {
                        process.exit();
                    }
                    else {
                        throw new Error('statsworker wilt niet dood??' + bericht.data);
                    }
                }
            });
        }
    };
});
