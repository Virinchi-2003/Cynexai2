import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { PiperService } from '../services/PiperService';
export declare class TtsController extends BaseController {
    private readonly piperService;
    constructor(piperService: PiperService);
    generateSpeech(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=TtsController.d.ts.map