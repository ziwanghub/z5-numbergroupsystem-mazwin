import { FormulaComputeContext, FormulaDefinition, FormulaGuardrails } from "../models/Formula";

export const FORMULA_GUARDRAILS = {
    MAX_N: 10,
    MAX_K: 6,
    MAX_GROUPS_ESTIMATE: 50000
};

export interface RuntimeResult {
    status: "ok" | "blocked";
    data: string[];
    reason?: string;
    estimate?: number;
}

const clampEstimate = (value: number, guardrails: FormulaGuardrails) => {
    if (!Number.isFinite(value)) return guardrails.maxGroupsEstimate + 1;
    return Math.min(value, guardrails.maxGroupsEstimate + 1);
};

export const estimateCombination = (n: number, k: number, guardrails: FormulaGuardrails) => {
    if (k > n || k < 0) return 0;
    let result = 1;
    for (let i = 1; i <= k; i += 1) {
        result = (result * (n - (k - i))) / i;
    }
    return clampEstimate(Math.round(result), guardrails);
};

export const estimatePermutation = (n: number, k: number, guardrails: FormulaGuardrails) => {
    if (k > n || k < 0) return 0;
    let result = 1;
    for (let i = 0; i < k; i += 1) {
        result *= (n - i);
    }
    return clampEstimate(result, guardrails);
};

export const estimateWithRepeats = (n: number, k: number, guardrails: FormulaGuardrails) => {
    return clampEstimate(Math.pow(n, k), guardrails);
};

export const runFormulaWithGuardrails = <TParams>(
    formula: FormulaDefinition<TParams>,
    ctx: FormulaComputeContext<TParams>
): RuntimeResult => {
    const digitCount = ctx.digits.length;
    const sizeParam = (ctx.params as { size?: number }).size;
    const guardrails = formula.guardrails || {
        maxN: FORMULA_GUARDRAILS.MAX_N,
        maxK: FORMULA_GUARDRAILS.MAX_K,
        maxGroupsEstimate: FORMULA_GUARDRAILS.MAX_GROUPS_ESTIMATE
    };

    if (digitCount > guardrails.maxN) {
        return {
            status: "blocked",
            data: [],
            reason: "Input too large"
        };
    }

    if (sizeParam && sizeParam > guardrails.maxK) {
        return {
            status: "blocked",
            data: [],
            reason: "Group size too large"
        };
    }

    if (formula.estimate) {
        const estimate = formula.estimate(ctx);
        if (estimate.estimatedGroups > guardrails.maxGroupsEstimate) {
            return {
                status: "blocked",
                data: [],
                reason: estimate.reason || "Computation too large",
                estimate: estimate.estimatedGroups
            };
        }
    }

    return {
        status: "ok",
        data: formula.compute(ctx)
    };
};
