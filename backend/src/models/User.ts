import mongoose, { Document, Schema } from 'mongoose';

export const ROLES = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    ADMIN: 'ADMIN',
    AUDITOR: 'AUDITOR',
    SUPPORT: 'SUPPORT',
    USER: 'USER'
};

export const SUBSCRIPTION_PLANS = {
    FREE: 'FREE',
    PRO: 'PRO',
    ENTERPRISE: 'ENTERPRISE'
};

export interface IUser extends Document {
    username: string;
    password?: string;
    role: string;
    // [NEW] Multi-Tenant Fields
    ownerId?: mongoose.Types.ObjectId; // Optional for now until migration
    parentId?: mongoose.Types.ObjectId;
    permissions?: string[];

    subscription: {
        plan: string;
        status: string;
        startDate: Date;
        expiresAt: Date | null;
    };
    createdAt: Date;
    updatedAt: Date;
    lastLoginIp?: string;
}

const UserSchema: Schema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: Object.values(ROLES),
            default: ROLES.USER,
            uppercase: true,
            trim: true
        },
        // [NEW] Multi-Tenant Ownership
        ownerId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null // Will be populated via migration or registration
        },
        parentId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        permissions: {
            type: [String],
            default: []
        },
        subscription: {
            plan: {
                type: String,
                enum: Object.values(SUBSCRIPTION_PLANS),
                default: SUBSCRIPTION_PLANS.FREE
            },
            status: {
                type: String,
                enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'CANCELLED'],
                default: 'ACTIVE'
            },
            startDate: {
                type: Date,
                default: Date.now
            },
            expiresAt: {
                type: Date,
                default: null
            }
        },
        lastLoginIp: {
            type: String,
            default: null
        }
    },
    {
        versionKey: false,
        timestamps: true,
        strict: true,
    }
);

export default mongoose.model<IUser>('User', UserSchema);
