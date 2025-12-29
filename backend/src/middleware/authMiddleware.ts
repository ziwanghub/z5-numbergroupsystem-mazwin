import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

export default function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies?.auth_token;

    if (!token) {
        res.status(401).json({
            success: false,
            error: 'AUTH_UNAUTHORIZED',
            message: 'Authentication required',
        });
        return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error('FATAL: JWT_SECRET missing');
        process.exit(1);
    }

    try {
        const payload = jwt.verify(token, secret) as JwtPayload;

        req.user = {
            id: payload.id,
            role: payload.role,
            ownerId: payload.ownerId // [NEW] Read Tenancy
        };

        next();
    } catch (err) {
        res.status(401).json({
            success: false,
            error: 'AUTH_UNAUTHORIZED',
            message: 'Invalid or expired token',
        });
        return;
    }
}
