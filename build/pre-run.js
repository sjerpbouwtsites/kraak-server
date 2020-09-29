/**
 * @file Dit script draait elke keer vóór de uitvoering van
 * 1. draaien van index.js
 *
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
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
    const fs = __importStar(require("fs"));
    const config_1 = __importDefault(require("./config"));
    /**
     * kan overschreven worden vanuit index.ts
     */
    const preRunConfig = {
        aantalRechtbankScrapesWeg: 5
    };
    /**
     * Tijdens bouwen rechtbanken scrape en verwerking laatste
     * 5 kunnen verwijderen
     */
    const verwijderLaatsteRechtbankScrapes = function (conf) {
        const rbpad = `${config_1.default.pad.scrapeRes}/rechtbank`;
        const { aantalRechtbankScrapesWeg } = conf || preRunConfig;
        const alleRechtbankScrapes = fs.readdirSync(rbpad);
        const errors = [];
        for (let i = 0; i < aantalRechtbankScrapesWeg; i++) {
            const teVerwijderen = alleRechtbankScrapes.pop();
            try {
                fs.unlinkSync(`${rbpad}/${teVerwijderen}`);
            }
            catch (err) {
                errors.push(err);
            }
        }
        return errors.length > 0 ? errors : null;
    };
    /**
     * Runner te gebruiken in index.ts.
     * geef evt. fouten terug.
     */
    function default_1(configVanController) {
        let preE = [];
        let e = verwijderLaatsteRechtbankScrapes(configVanController);
        if (!!e && e.length > 0) {
            preE = preE.concat(e);
            e = [];
        }
        return preE.length > 0 ? preE : null;
    }
    exports.default = default_1;
});
