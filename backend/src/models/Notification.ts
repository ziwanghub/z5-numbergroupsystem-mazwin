
import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
    recipientId: mongoose.Types.ObjectId;
    type: 'TICKET_REPLY' | 'TICKET_STATUS' | 'REVIEW_POSTED' | 'SYSTEM_ALERT';
    title: string;
    message: string;
    refId?: mongoose.Types.ObjectId; // Link to Ticket/Review
    link?: string;
    isRead: boolean;
    createdAt: Date;
}

const NotificationSchema: Schema = new Schema({
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
        type: String,
        enum: ['TICKET_REPLY', 'TICKET_STATUS', 'REVIEW_POSTED', 'SYSTEM_ALERT'],
        required: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    refId: { type: Schema.Types.ObjectId },
    link: { type: String },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

NotificationSchema.index({ recipientId: 1, isRead: 1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);
