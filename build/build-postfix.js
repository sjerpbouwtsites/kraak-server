/**
 * @file TS snapt dingen niet. of ik. Sowieso typescript.
 * build achteraf fiksen.
 * gedraaid als npm taak in de build folder
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "fs"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.tsHelpenPublicFolderOverzetten = void 0;
    const fs_1 = __importDefault(require("fs"));
    /**
     *   handmatig de niet JS & TS bestanden uit src/public naar build/public overzetten.
     */
    function tsHelpenPublicFolderOverzetten() {
        const srcPublic = fs_1.default.readdirSync(__dirname + '/../src/public');
        srcPublic
            .filter((bestandsnaam) => {
            return !bestandsnaam.includes('.ts') && !bestandsnaam.includes('.js');
        })
            .forEach((bestandsnaam) => {
            fs_1.default.copyFileSync(__dirname + `/../src/public/${bestandsnaam}`, __dirname + `/public/${bestandsnaam}`);
        });
    }
    exports.tsHelpenPublicFolderOverzetten = tsHelpenPublicFolderOverzetten;
    tsHelpenPublicFolderOverzetten();
});
