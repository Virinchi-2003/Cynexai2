import { Response } from 'express';
export declare abstract class BaseController {
    protected handleSuccess(res: Response, data: any, statusCode?: number): void;
    protected handleError(error: any, res: Response, context: string): void;
}
//# sourceMappingURL=BaseController.d.ts.map