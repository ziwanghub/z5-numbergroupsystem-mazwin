export interface CalculationResult {
    id: string;
    resultType: 'dynamic' | 'static';
    title: string;
    data: string[];
    total: number;
    formulaId?: string;
    formulaVersion?: string;
    capabilities?: {
        canCompute: boolean;
        canCopy: boolean;
        requiresConsent: boolean;
        isBlocked: boolean;
        severity: "info" | "warn" | "block";
        message?: string;
    };
}
