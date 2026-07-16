"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const TtsController_1 = require("../controllers/TtsController");
const PiperService_1 = require("../services/PiperService");
const asyncErrorWrapper_1 = require("../middleware/asyncErrorWrapper");
const router = (0, express_1.Router)();
// Dependency Injection
const piperService = new PiperService_1.PiperService();
const ttsController = new TtsController_1.TtsController(piperService);
router.post('/', (0, asyncErrorWrapper_1.asyncErrorWrapper)(async (req, res) => ttsController.generateSpeech(req, res)));
exports.default = router;
//# sourceMappingURL=ttsRoutes.js.map