import { JwtPayload } from 'jsonwebtoken';

declare global {
    namespace Express {
        interface Request {
            user?: string | JwtPayload | { id: string; role: string;[key: string]: any };
        }
    }
}
