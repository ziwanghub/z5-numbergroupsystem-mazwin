import mongoose, { Document, Schema } from "mongoose";

export interface IAuditLog extends Document {
    event: string;
    level: 'INFO' | 'WARNING' | 'CRITICAL';
    actor: {
        userId: mongoose.Types.ObjectId | null;
        ip: string;
        userAgent: string;
    };
    timestamp: Date;
    metadata?: any;
}

const auditLogSchema: Schema = new Schema({
    event: {
        type: String,
        required: true,
        enum: [
            'AUTH_REGISTER_SUCCESS',
            'AUTH_LOGIN_SUCCESS',
            'AUTH_LOGIN_FAIL',
            'AUTH_LOGOUT',
            'AUTH_CHECK_FAIL',
            'SYSTEM_ERROR'
        ]
    },
    level: {
        type: String,
        enum: ['INFO', 'WARNING', 'CRITICAL'],
        default: 'INFO'
    },
    actor: {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        ip: { type: String, default: 'UNKNOWN' },
        userAgent: { type: String, default: 'UNKNOWN' }
    },
    timestamp: {
        type: Date,
        default: Date.now,
        immutable: true
    },
    metadata: { type: Schema.Types.Mixed }
});

auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ 'actor.userId': 1 });

export default mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
