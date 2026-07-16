"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.config = {
    server: {
        port: process.env.PORT || 3001,
    },
    piper: {
        binaryPath: process.env.PIPER_BINARY_PATH || '/usr/bin/piper',
        modelPath: process.env.PIPER_MODEL_PATH || '/models/en_US-amy-medium.onnx',
    }
};
//# sourceMappingURL=unifiedConfig.js.map