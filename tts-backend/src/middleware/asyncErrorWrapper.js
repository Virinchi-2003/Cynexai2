"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncErrorWrapper = void 0;
const express_1 = require("express");
const asyncErrorWrapper = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};
exports.asyncErrorWrapper = asyncErrorWrapper;
//# sourceMappingURL=asyncErrorWrapper.js.map