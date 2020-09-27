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
        /**
         * promise achtige vertrager. syntax als
         * nuts.time(5000).then(func) of await nuts.time(5000);
         * @param func
         * @param tijd
         */
        time(tijd) {
            return new Promise((goed) => {
                setTimeout(goed, tijd);
            });
        }
    };
});
