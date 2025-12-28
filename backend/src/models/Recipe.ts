import mongoose, { Schema, Document } from 'mongoose';

export interface IRecipe extends Document {
    userId: mongoose.Types.ObjectId;
    name: string;
    description?: string;
    baseFormulaId: string;
    config: any;
    uiOptions: {
        color: string;
        icon: string;
    };
    isSystem: boolean;
    createdAt: Date;
}

const RecipeSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    description: { type: String },
    baseFormulaId: { type: String, required: true },
    config: { type: Object, required: true },
    uiOptions: {
        color: { type: String, default: 'blue' },
        icon: { type: String, default: 'hash' }
    },
    isSystem: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

// Index mainly by User for fast retrieval
RecipeSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<IRecipe>('Recipe', RecipeSchema);
