"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const ttsRoutes_1 = __importDefault(require("./routes/ttsRoutes"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.use('/api/tts', ttsRoutes_1.default);
// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'piper-tts-backend' });
});
exports.default = app;
//# sourceMappingURL=app.js.map