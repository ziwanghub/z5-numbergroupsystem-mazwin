export type WidgetType = 'dynamic' | 'static';

export interface WidgetRule {
    size: number;        // 2 or 3
    mode: 'C' | 'P';     // Combination vs Permutation
    allowDouble: boolean;
    staticGroupKey?: string; // For static widgets (e.g., 'SIBLINGS')
}

export interface WidgetConfig {
    id: string;          // UUID
    title: string;       // Custom title
    formulaId: string;
    formulaVersion: string;
    params: Record<string, unknown>;
    type?: WidgetType;
    rules?: WidgetRule; // Deprecated: kept for backward compatibility
}
