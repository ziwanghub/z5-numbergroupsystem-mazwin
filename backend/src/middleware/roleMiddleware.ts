import { Request, Response, NextFunction } from 'express';

/**
 * Role-Based Access Control (RBAC) Middleware
 * @param {...String} allowedRoles - รายชื่อ Role ที่อนุญาตให้เข้าใช้งาน
 */
const checkRole = (...allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // 1. ตรวจสอบว่ามีข้อมูล User จาก authMiddleware หรือไม่
        if (!req.user || typeof req.user === 'string' || !('role' in req.user)) {
            res.status(401).json({
                success: false,
                error: 'AUTH_UNAUTHORIZED',
                message: 'Authentication required before role check',
            });
            return;
        }

        // 2. ตรวจสอบ Role ของ User เทียบกับ Role ที่อนุญาต
        const userRole = (req.user as any).role.toUpperCase();
        const allowed = allowedRoles.map(role => role.toUpperCase());

        if (!allowed.includes(userRole)) {
            // 🛑 STOP: 403 Forbidden (รู้ว่าใคร แต่สิทธิ์ไม่ถึง)
            res.status(403).json({
                success: false,
                error: 'AUTH_FORBIDDEN',
                message: `Access denied. Role '${userRole}' is not authorized.`,
            });
            return;
        }

        // ✅ PASS: อนุญาตให้ไปต่อ
        next();
    };
};

export default checkRole;
