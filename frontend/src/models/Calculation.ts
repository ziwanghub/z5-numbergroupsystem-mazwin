// src/models/Calculation.ts

export interface CalculationResult {
    id: string; // Unique ID for the panel
    type: 'dynamic' | 'static';
    title: string; // e.g. "2 Digits (No Double)" or "Holy Day Numbers"
    data: string[];
    config?: {
        size: 2 | 3;
        mode: 'C' | 'P';
        allowDouble: boolean;
    };
    stats: {
        count: number;
    };
}
