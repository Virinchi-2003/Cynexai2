"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PiperService = void 0;
const child_process_1 = require("child_process");
const stream_1 = require("stream");
const unifiedConfig_1 = require("../config/unifiedConfig");
class PiperService {
    /**
     * Spawns the Piper TTS binary and returns a readable stream of the generated WAV audio.
     */
    generateAudioStream(text) {
        // piper --model <modelPath> --output_raw | stdout
        // Actually, Piper outputs WAV by default if we use --output_file -
        // or if we omit it and just pipe.
        // The standard usage is: echo "text" | piper --model model.onnx --output_file -
        const piper = (0, child_process_1.spawn)(unifiedConfig_1.config.piper.binaryPath, [
            '--model', unifiedConfig_1.config.piper.modelPath,
            '--output_file', '-'
        ]);
        // Write the text to Piper's stdin
        piper.stdin.write(text + '\n');
        piper.stdin.end();
        // Handle errors so the node process doesn't crash
        piper.on('error', (err) => {
            console.error('[PiperService] Failed to spawn Piper binary:', err);
        });
        piper.stderr.on('data', (data) => {
            // Piper logs model loading etc to stderr. We can log or ignore.
            // console.log(`[Piper] ${data.toString()}`);
        });
        // The audio stream is returned via stdout
        return piper.stdout;
    }
}
exports.PiperService = PiperService;
//# sourceMappingURL=PiperService.js.map