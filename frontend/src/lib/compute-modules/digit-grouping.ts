import { FormulaEntry, FormulaGuardrails, FormulaDefinition } from "../../models/Formula";
import { MathEngine } from "../math-engine";
import { estimateCombination, estimatePermutation, estimateWithRepeats } from "../formula-runtime";

type FormulaParams = { size: number; mode: "C" | "P"; allowDouble: boolean };

const DEFAULT_GUARDRAILS: FormulaGuardrails = {
    maxN: 10,
    maxK: 6,
    maxGroupsEstimate: 50000
};

import { ComputeTemplate } from "./types";

export const digitGroupingTemplate: ComputeTemplate = {
    key: "digits-group",
    name: "Digit Grouping",
    friendlyName: "จับคู่/วินเลข (Digit Grouping)",
    description: "Combination/Permutation grouping with optional repeats",
    formulaText: "C(n, k) / P(n, k) over unique digits",
    paramsSpec: {
        size: { type: "number", required: true, description: "Group size (k)" },
        mode: { type: "C | P", required: true, description: "Combination or Permutation" },
        allowDouble: { type: "boolean", required: true, defaultValue: false, description: "Allow repeated digits" }
    },
    inputSpec: {
        params: {
            size: { type: "number", required: true, description: "Group size (k)" },
            mode: { type: "C | P", required: true, description: "Combination or Permutation" },
            allowDouble: { type: "boolean", required: true, defaultValue: false, description: "Allow repeated digits" }
        }
    },
    outputSpec: {
        description: "Normalized output for workstation panels",
        contract: "array of strings, total count"
    },
    guardrails: DEFAULT_GUARDRAILS,
    estimate: ({ digits, params }) => {
        const { size, mode, allowDouble } = params as FormulaParams;
        if (allowDouble) {
            return { estimatedGroups: estimateWithRepeats(digits.length, size, DEFAULT_GUARDRAILS) };
        }
        if (mode === "P") {
            return { estimatedGroups: estimatePermutation(digits.length, size, DEFAULT_GUARDRAILS) };
        }
        return { estimatedGroups: estimateCombination(digits.length, size, DEFAULT_GUARDRAILS) };
    },
    compute: ({ digits, params }) => {
        const { size, mode, allowDouble } = params as FormulaParams;
        const safeSize = size === 2 || size === 3 ? (size as 2 | 3) : 2;
        return MathEngine.calculate(digits, safeSize, mode, allowDouble);
    }
};
