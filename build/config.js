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
    exports.config = void 0;
    const path_1 = require("path");
    // let op geschreven voor de JS kant... zit dus in een build context
    exports.config = {
        pad: {
            db: path_1.resolve(`${__dirname}/../db`),
            nuts: path_1.resolve(`${__dirname}/nuts`),
            temp: path_1.resolve(`${__dirname}/temp`),
            scrapeRes: path_1.resolve(`${__dirname}/../scrape-res`)
        },
        opties: {
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
        }
    };
});
