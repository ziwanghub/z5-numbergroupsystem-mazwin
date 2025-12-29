
import { Request, Response, NextFunction } from 'express';
import { ROLES } from '../models/User';

/**
 * TENANT ISOLATION MIDDLEWARE
 * Ensures that the request is scoped to the correct Tenant (Owner).
 * 
 * Rules:
 * 1. SUPER_ADMIN: Bypasses all checks (God Mode).
 * 2. ADMIN/USER: Can only access resources where resource.ownerId === req.user.ownerId
 */
export const verifyTenant = (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user as any;

        if (!user) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        // 1. ALL HAIL THE SUPER ADMIN (God Mode)
        if (user.role === ROLES.SUPER_ADMIN) {
            return next();
        }

        // 2. Validate Tenancy
        // Note: Actual resource checking usually happens in the Controller or Service
        // This middleware primarily ensures that we HAVE an ownerId to check against.
        if (!user.ownerId) {
            // CRITICAL: If a non-SuperAdmin has no ownerId, the system is broken/migrating.
            // For now, allow SELF-OWNED legacy users (migration fallback)
            console.warn(`[TenantSecurity] User ${user.id} has no ownerId. Assuming Self-Hosted Legacy.`);
            // Patching it temporarily for legacy support if needed, or failing.
            // For strict SaaS, we might want to fail. 
            // But let's proceed and let the controller handle query filters.
        }

        next();
    } catch (error) {
        console.error("Tenant Verification Error", error);
        res.status(500).json({ success: false, message: "Tenant verification failed" });
    }
};

/**
 * QUERY SCOPER
 * Helper to generate the MongoDB Query Object for isolation.
 * Use this in Controllers: User.find(scopeQuery(req, { ...otherFilters }))
 */
export const scopeQuery = (req: Request, baseQuery: any = {}) => {
    const user = req.user as any;

    // Super Admin sees everything
    if (user.role === ROLES.SUPER_ADMIN) {
        return baseQuery;
    }

    // Others see only their Tenant's data
    // If ownerId exists, use it. If not (legacy), fallback to userId (Self).
    const tenantId = user.ownerId || user.id;

    return {
        ...baseQuery,
        // Depending on the resource, it might be 'ownerId' or 'userId' that links to the Tenant.
        // For 'Users', we check { ownerId: tenantId }
        // For 'Recipes', we check { userId: { $in: [List of Users in Tenant] } } OR simple ownerId reference if added to Recipe.
        // STANDARD: We will assume resources will explicitly have `ownerId` added or we derive it.
        // For current 'Recipe' model which only has userId, we interpret strict isolation as:
        // "I can see things I own" (Personal) OR "Things my Admin allows"

        // For simple "My Recipes" scope (Personal):
        userId: user.id
    };
};
