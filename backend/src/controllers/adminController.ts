
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User, { ROLES } from '../models/User';
import { logEvent } from '../services/auditService';

// Create New Tenant (Admin)
export const createTenant = async (req: Request, res: Response) => {
    try {
        const { organizationName, email, password } = req.body;
        const superAdminId = (req as any).user.id;

        // 1. Validation
        if (!email || !password || !organizationName) {
            res.status(400).json({ success: false, message: 'All fields are required' });
            return;
        }

        const existingUser = await User.findOne({ username: email });
        if (existingUser) {
            res.status(400).json({ success: false, message: 'User already exists' });
            return;
        }

        // 2. Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Create User (Tenant Admin)
        const newTenant = new User({
            username: email,
            password: hashedPassword,
            role: ROLES.ADMIN,
            // [CRITICAL] Tenancy Logic
            // An ADMIN is a Tenant Owner, so they own themselves.
            ownerId: null, // Will be set to self after save, or we can generate ID first.
            parentId: superAdminId, // Created by Super Admin
            subscription: {
                status: 'ACTIVE',
                plan: 'PRO' // Default to PRO for new Tenants
            },
            // Store Org Name in metadata or profile (schema might need update if we want strict org field)
            // For now, we assume username/profile handles identity. 
            // Ideally, we'd have an Organization model, but per instructions, we stick to User model.
        });

        // Generate ID to set ownerId to self
        newTenant.ownerId = newTenant._id;

        await newTenant.save();

        // 4. Audit Log
        await logEvent(req, {
            event: 'ADMIN_CREATED_TENANT',
            level: 'INFO',
            userId: superAdminId,
            metadata: {
                newTenantId: newTenant._id,
                organization: organizationName
            }
        });

        res.status(201).json({
            success: true,
            message: 'Tenant created successfully',
            tenant: {
                id: newTenant._id,
                username: newTenant.username,
                role: newTenant.role
            }
        });

    } catch (err: any) {
        console.error('CREATE TENANT ERROR:', err);
        res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Server error' });
    }
};
// Get All Tenants (Admins)
export const getTenants = async (req: Request, res: Response) => {
    try {
        const tenants = await User.aggregate([
            { $match: { role: 'ADMIN' } },
            {
                $lookup: {
                    from: 'users', // Collection name (adjust if Mongoose pluralizes differently)
                    localField: '_id',
                    foreignField: 'ownerId',
                    as: 'subUsers'
                }
            },
            {
                $project: {
                    _id: 1,
                    username: 1, // acts as email usually
                    organizationName: 1, // if added later
                    createdAt: 1,
                    subscription: 1,
                    stats: {
                        userCount: { $size: '$subUsers' }
                    }
                }
            },
            { $sort: { createdAt: -1 } }
        ]);

        res.json({
            success: true,
            tenants
        });
    } catch (err: any) {
        console.error('GET TENANTS ERROR:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
