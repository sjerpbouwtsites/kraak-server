(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "path"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const path_1 = require("path");
    const config = {
        pad: {
            db: path_1.resolve(`${__dirname}/../db`),
            nuts: path_1.resolve(`${__dirname}/nuts`),
            temp: path_1.resolve(`${__dirname}/temp`),
            public: path_1.resolve(`${__dirname}/public`),
            scrapeRes: path_1.resolve(`${__dirname}/../scrape-res`) // buiten build folder
        },
        server: {
            publicPort: 8080
        },
        toegestaneClusters: [
            // clusters van faillissementsuitspraken
            'einde faillissementen',
            'uitspraken faillissement',
            'vereenvoudigde afwikkeling faillissementen',
            'surseances',
            'faillissementen',
            'neerlegging tussentijdse uitdelingslijst in faillissementen',
            'neerlegging slotuitdelingslijst in faillissementen'
        ],
        ontoegestaneClusters: [
            'rectificatie',
            'uitspraken schuldsanering',
            'zittingen in schuldsaneringen',
            'einde schuldsaneringen',
            'neerlegging slotuitdelingslijst in schuldsaneringen',
            'vervanging cur / bwv',
            'einde surseances',
            'uitspraken surseance',
            'schuldsaneringen',
            'zittingen in faillissementen'
        ]
    };
    exports.default = config;
});
