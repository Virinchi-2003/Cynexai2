import { Request, Response, NextFunction } from 'express';
export declare const asyncErrorWrapper: (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=asyncErrorWrapper.d.ts.map