import { z } from 'zod';
export declare const ttsSchema: z.ZodObject<{
    text: z.ZodString;
    voice: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type TtsRequest = z.infer<typeof ttsSchema>;
//# sourceMappingURL=tts.schema.d.ts.map