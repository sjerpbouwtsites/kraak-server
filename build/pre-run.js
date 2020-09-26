/**
 * Dit script draait elke keer vóór de uitvoering van
 * 1. draaien van index.js
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "fs", "./config"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.preRunScripts = void 0;
    const fs = __importStar(require("fs"));
    const config_1 = require("./config");
    /**
     * Tijdens bouwen rechtbanken scrape en verwerking laatste
     * 5 kunnen verwijderen
     */
    const verwijderLaatsteVijfRechtbankScrapes = function () {
        const rbpad = `${config_1.config.pad.scrapeRes}/rechtbank`;
        const alleRechtbankScrapes = fs.readdirSync(rbpad);
        for (let i = 0; i < 3; i++) {
            const teVerwijderen = alleRechtbankScrapes.pop();
            try {
                fs.unlinkSync(`${rbpad}/${teVerwijderen}`);
            }
            catch (err) {
                console.error(err);
            }
        }
    };
    /**
     * Runner te gebruiken in index.ts
     */
    exports.preRunScripts = function () {
        verwijderLaatsteVijfRechtbankScrapes();
    };
});
