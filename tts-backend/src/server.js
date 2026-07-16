"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const unifiedConfig_1 = require("./config/unifiedConfig");
const PORT = unifiedConfig_1.config.server.port;
app_1.default.listen(PORT, () => {
    console.log(`[Server] TTS Backend running on port ${PORT}`);
    console.log(`[Piper] Binary path set to: ${unifiedConfig_1.config.piper.binaryPath}`);
    console.log(`[Piper] Model path set to: ${unifiedConfig_1.config.piper.modelPath}`);
});
//# sourceMappingURL=server.js.map