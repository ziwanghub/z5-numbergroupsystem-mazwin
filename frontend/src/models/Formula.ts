export interface EstimateInfo {
    estimatedGroups: number;
    reason?: string;
}

export interface FormulaComputeContext<TParams = Record<string, unknown>> {
    digits: string[];
    params: TParams;
}

export interface FormulaParamSpec {
    type: string;
    required?: boolean;
    defaultValue?: string | number | boolean;
    description?: string;
}

export interface FormulaInputSpec {
    params?: Record<string, FormulaParamSpec>;
    properties?: Record<string, FormulaParamSpec>;
}

export interface FormulaOutputSpec {
    description: string;
    contract: string;
}

export interface FormulaGuardrails {
    maxN: number;
    maxK: number;
    maxGroupsEstimate: number;
}

export type FormulaVersionStatus = "draft" | "active" | "deprecated" | "archived";

export interface FormulaVersion {
    formulaId: string;
    version: string;
    status: FormulaVersionStatus;
    isLocked?: boolean;
    computeKey: string;
    logic?: string; // Dynamic JS String
    inputSpec: FormulaInputSpec;
    outputSpec: FormulaOutputSpec;
    guardrails: FormulaGuardrails;
    changeNote?: string;
    createdAt: string;
}

export interface FormulaEntry {
    id: string;
    displayName: string;
    description: string;
    tags: string[];
    versions: FormulaVersion[];
}

export interface FormulaDefinition<TParams = Record<string, unknown>> {
    id: string;
    version: string;
    name: string;
    description: string;
    formulaText?: string;
    tags?: string[];
    paramsSpec?: Record<string, FormulaParamSpec>;
    inputSpec?: FormulaInputSpec;
    outputSpec?: FormulaOutputSpec;
    guardrails: FormulaGuardrails;
    status: FormulaVersionStatus;
    isLocked?: boolean;
    computeKey: string;
    estimate?: (ctx: FormulaComputeContext<TParams>) => EstimateInfo;
    compute: (ctx: FormulaComputeContext<TParams>) => string[];
}

export type FormulaCapabilities = {
    canCompute: boolean;
    canCopy: boolean;
    requiresConsent: boolean;
    isBlocked: boolean;
    severity: "info" | "warn" | "block";
    message?: string;
};

export type FormulaParams = Record<string, unknown>;
