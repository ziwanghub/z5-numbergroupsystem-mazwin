import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
    recipeId: string; // Formula ID (e.g., 'z-master') or Custom Recipe ID
    userId: mongoose.Types.ObjectId;
    ownerId: mongoose.Types.ObjectId; // Tenant Scope
    rating: number; // 1-5
    comment?: string;
    createdAt: Date;
}

const ReviewSchema: Schema = new Schema({
    recipeId: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 500 },
    createdAt: { type: Date, default: Date.now }
});

// Index for efficient querying by tenant and recipe
ReviewSchema.index({ ownerId: 1, recipeId: 1 });

export default mongoose.model<IReview>('Review', ReviewSchema);
