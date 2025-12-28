import mongoose, { Document, Schema } from 'mongoose';

export interface IFormulaVersion {
    version: string;
    status: 'draft' | 'active' | 'deprecated' | 'archived';
    computeKey: string; // Key to the computation logic/template
    inputSpec?: any; // JSON schema for inputs
    outputSpec?: any; // JSON schema or description for output
    guardrails?: {
        maxN?: number;
        maxK?: number;
        maxGroupsEstimate?: number;
    };
    isLocked: boolean;
    changeNote?: string;
    createdAt: Date;
    publishedAt?: Date;
}

export interface IFormula extends Document {
    formulaId: string; // Unique URL-friendly ID (e.g. "digit-grouping")
    displayName: string;
    description: string;
    tags: string[];
    ownerId: mongoose.Types.ObjectId; // Reference to User
    versions: IFormulaVersion[];
    createdAt: Date;
    updatedAt: Date;
}

const FormulaSchema: Schema = new Schema(
    {
        formulaId: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },
        displayName: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            default: ''
        },
        tags: [{
            type: String,
            trim: true
        }],
        ownerId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        versions: [{
            version: { type: String, required: true },
            status: {
                type: String,
                enum: ['draft', 'active', 'deprecated', 'archived'],
                default: 'draft'
            },
            computeKey: { type: String, required: true },
            logic: { type: String }, // Dynamic JS logic string
            inputSpec: { type: Schema.Types.Mixed, default: {} },
            outputSpec: { type: Schema.Types.Mixed, default: {} }, // Can be rich object
            guardrails: {
                maxN: Number,
                maxK: Number,
                maxGroupsEstimate: Number
            },
            isLocked: { type: Boolean, default: false },
            changeNote: String,
            createdAt: { type: Date, default: Date.now },
            publishedAt: Date
        }]
    },
    {
        timestamps: true,
        versionKey: false
    }
);

export default mongoose.model<IFormula>('Formula', FormulaSchema);
