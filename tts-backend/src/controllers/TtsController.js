"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TtsController = void 0;
const express_1 = require("express");
const BaseController_1 = require("./BaseController");
const PiperService_1 = require("../services/PiperService");
const tts_schema_1 = require("../validators/tts.schema");
class TtsController extends BaseController_1.BaseController {
    piperService;
    constructor(piperService) {
        super();
        this.piperService = piperService;
    }
    async generateSpeech(req, res) {
        try {
            // 1. Validate Input
            const input = tts_schema_1.ttsSchema.parse(req.body);
            // 2. Set headers for audio stream
            res.setHeader('Content-Type', 'audio/wav');
            res.setHeader('Transfer-Encoding', 'chunked');
            // 3. Call Service and Pipe to Response
            const audioStream = this.piperService.generateAudioStream(input.text);
            // If the piper process errors out, we need to handle it
            audioStream.on('error', (err) => {
                if (!res.headersSent) {
                    this.handleError(err, res, 'generateSpeech_Stream');
                }
                else {
                    res.end();
                }
            });
            audioStream.pipe(res);
        }
        catch (error) {
            this.handleError(error, res, 'generateSpeech');
        }
    }
}
exports.TtsController = TtsController;
//# sourceMappingURL=TtsController.js.map