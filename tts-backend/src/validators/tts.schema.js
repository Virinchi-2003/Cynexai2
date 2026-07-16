"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ttsSchema = void 0;
const zod_1 = require("zod");
exports.ttsSchema = zod_1.z.object({
    text: zod_1.z.string().min(1, "Text is required").max(5000, "Text is too long"),
    voice: zod_1.z.string().optional()
});
//# sourceMappingURL=tts.schema.js.map