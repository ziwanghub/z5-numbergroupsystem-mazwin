
import mongoose, { Schema, Document } from 'mongoose';

export interface ITicket extends Document {
    title: string;
    description: string;
    category: 'BUG' | 'FEATURE' | 'CALCULATION_ERROR' | 'OTHER';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    status: 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

    // Snapshot of the state when issue was reported
    snapshot?: {
        formulaId?: string;
        inputs?: Record<string, any>;
        outputs?: Record<string, any>;
        clientInfo?: {
            browser: string;
            userAgent: string;
            screenSize: string;
        };
    };

    // Conversation
    messages: Array<{
        _id?: mongoose.Types.ObjectId;
        senderId: mongoose.Types.ObjectId;
        senderName: string;
        content: string;
        isInternal: boolean; // If true, visible only to ADMINs
        timestamp: Date;
    }>;

    // Relations
    userId: mongoose.Types.ObjectId; // Reporter
    ownerId: mongoose.Types.ObjectId; // Tenant Owner (Admin)
    assignedTo?: mongoose.Types.ObjectId;

    createdAt: Date;
    updatedAt: Date;
}

const TicketSchema: Schema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: {
        type: String,
        enum: ['BUG', 'FEATURE', 'CALCULATION_ERROR', 'OTHER'],
        default: 'OTHER'
    },
    severity: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        default: 'MEDIUM'
    },
    status: {
        type: String,
        enum: ['NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
        default: 'NEW'
    },
    snapshot: {
        formulaId: { type: String },
        inputs: { type: Schema.Types.Mixed },
        outputs: { type: Schema.Types.Mixed },
        clientInfo: {
            browser: String,
            userAgent: String,
            screenSize: String
        }
    },
    messages: [{
        senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        senderName: { type: String, required: true },
        content: { type: String, required: true },
        isInternal: { type: Boolean, default: false },
        timestamp: { type: Date, default: Date.now }
    }],
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Tenancy Scope
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: true
});

// Index for efficient querying by Tenant and User
TicketSchema.index({ ownerId: 1, status: 1 });
TicketSchema.index({ userId: 1 });

export default mongoose.model<ITicket>('Ticket', TicketSchema);
