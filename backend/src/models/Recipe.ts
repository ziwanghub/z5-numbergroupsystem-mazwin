import mongoose, { Schema, Document } from 'mongoose';

export interface IRecipe extends Document {
    userId: mongoose.Types.ObjectId;
    ownerId: mongoose.Types.ObjectId; // [NEW] Tenant Owner
    name: string;
    description?: string;
    baseFormulaId: string;
    config: any;
    uiOptions: {
        color: string;
        icon: string;
    };
    isSystem: boolean;
    // [NEW] Added fields
    isFavorite: boolean;
    tags: string[];
    // [NEW] Lifecycle & Versioning
    isActive: boolean;
    deletedAt: Date | null;
    version: number;
    createdAt: Date;
    updatedAt: Date;
}

const RecipeSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: false }, // Optional during migration
    name: { type: String, required: true },
    description: { type: String },
    baseFormulaId: { type: String, required: true },
    config: { type: Object, required: true },
    uiOptions: {
        color: { type: String, default: 'blue' },
        icon: { type: String, default: 'hash' }
    },
    isSystem: { type: Boolean, default: false },

    // [NEW] Added fields configuration
    isFavorite: { type: Boolean, default: false },
    tags: { type: [String], default: [] },

    // [NEW] Lifecycle & Versioning
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
    version: { type: Number, default: 1 }
}, {
    timestamps: true // This automatically adds createdAt and updatedAt
});

// Index mainly by User for fast retrieval, including deletedAt for trash bin performance
// Index mainly by User for fast retrieval, including deletedAt for trash bin performance
RecipeSchema.index({ userId: 1, deletedAt: 1 });
RecipeSchema.index({ ownerId: 1 }); // [NEW] Tenant Query Support

export default mongoose.model<IRecipe>('Recipe', RecipeSchema);
