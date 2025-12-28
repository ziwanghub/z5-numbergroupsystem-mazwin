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
