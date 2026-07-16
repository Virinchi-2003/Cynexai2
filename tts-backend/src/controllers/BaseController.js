"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseController = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
class BaseController {
    handleSuccess(res, data, statusCode = 200) {
        res.status(statusCode).json({
            success: true,
            data,
        });
    }
    handleError(error, res, context) {
        console.error(`[${context}] Error:`, error);
        // In a real app, send to Sentry here.
        if (error instanceof zod_1.ZodError) {
            res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: error.errors
            });
            return;
        }
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}
exports.BaseController = BaseController;
//# sourceMappingURL=BaseController.js.map