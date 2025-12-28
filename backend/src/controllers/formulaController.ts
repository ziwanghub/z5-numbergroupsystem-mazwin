import { Request, Response } from 'express';
import Formula from '../models/Formula';
import { logEvent } from '../services/auditService';

// List All Formulas
export const getAllFormulas = async (req: Request, res: Response) => {
    try {
        // Optional: Filter by status via query params if needed later
        // const { status } = req.query; 

        // Return minimal list for the library view
        const formulas = await Formula.find()
            .select('formulaId displayName description tags versions createdAt updatedAt')
            .sort({ displayName: 1 });

        res.status(200).json({
            success: true,
            data: formulas
        });
    } catch (err: any) {
        console.error('GET_FORMULAS_ERROR:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch formulas',
            error: err.message
        });
    }
};

// Create New Formula (Shell)
export const createFormula = async (req: Request, res: Response) => {
    try {
        const { formulaId, displayName, description, tags } = req.body;
        const userId = (req.user as any).id;

        if (!formulaId || !displayName) {
            res.status(400).json({
                success: false,
                message: 'Formula ID and Display Name are required'
            });
            return;
        }

        const existing = await Formula.findOne({ formulaId });
        if (existing) {
            res.status(409).json({
                success: false,
                message: 'Formula ID already exists'
            });
            return;
        }

        const newFormula = new Formula({
            formulaId,
            displayName,
            description,
            tags: tags || [],
            ownerId: userId,
            versions: [] // Start with empty versions, add Draft later
        });

        await newFormula.save();

        await logEvent(req, {
            event: 'FORMULA_CREATE',
            level: 'INFO',
            userId,
            metadata: { formulaId, displayName }
        });

        res.status(201).json({
            success: true,
            data: newFormula
        });

    } catch (err: any) {
        console.error('CREATE_FORMULA_ERROR:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to create formula',
            error: err.message
        });
    }
};

// Update Version Status
export const updateVersionStatus = async (req: Request, res: Response) => {
    try {
        const { formulaId, version } = req.params;
        const { status } = req.body;
        const userId = (req.user as any).id;

        if (!['active', 'draft', 'deprecated', 'archived'].includes(status)) {
            res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
            return;
        }

        const formula = await Formula.findOne({ formulaId });
        if (!formula) {
            res.status(404).json({
                success: false,
                message: 'Formula not found'
            });
            return;
        }

        const versionEntry = formula.versions.find(v => v.version === version);
        if (!versionEntry) {
            res.status(404).json({
                success: false,
                message: 'Version not found'
            });
            return;
        }

        const oldStatus = versionEntry.status;
        versionEntry.status = status;

        await formula.save();

        await logEvent(req, {
            event: 'FORMULA_STATUS_CHANGE',
            level: 'INFO',
            userId,
            metadata: {
                formulaId,
                version,
                oldStatus,
                newStatus: status
            }
        });

        res.status(200).json({
            success: true,
            data: formula
        });

    } catch (err: any) {
        console.error('UPDATE_STATUS_ERROR:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to update status',
            error: err.message
        });
    }
};
