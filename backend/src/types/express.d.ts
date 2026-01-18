// backend/src/types/express.d.ts
import { JWTPayload } from '../middleware/auth.middleware';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      tenantPrisma?: any;
    }
  }
}

export {};