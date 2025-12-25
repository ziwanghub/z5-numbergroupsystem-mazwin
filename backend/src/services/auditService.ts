import { Request } from 'express';
import AuditLog from '../models/AuditLog';

interface LogEventParams {
    event: string;
    level?: 'INFO' | 'WARNING' | 'CRITICAL';
    userId?: any;
    metadata?: any;
}

/**
 * Z-MOS Audit Service
 * Centralized logging for compliance and security
 */
export const logEvent = async (req: Request, { event, level, userId, metadata }: LogEventParams): Promise<void> => {
    try {
        // Extract Request Info safely
        const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'UNKNOWN';
        const userAgent = req.headers['user-agent'] || 'UNKNOWN';

        // Create Immutable Record
        await AuditLog.create({
            event,
            level: level || 'INFO',
            actor: {
                userId: userId || (req.user ? (req.user as any).id : null), // Cast req.user as any or typed
                ip,
                userAgent
            },
            metadata: metadata || {}
        });

        // In Dev mode, show in console too
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[AUDIT] ${event} | ${level || 'INFO'} | IP: ${ip}`);
        }

    } catch (error) {
        // Audit logging should NOT crash the main app, but must be reported
        console.error('FATAL: Audit Logging Failed', error);
    }
};
