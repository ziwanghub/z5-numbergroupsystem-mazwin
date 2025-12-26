import { FormulaGuardrails } from "../../models/Formula";
import { ComputeTemplate } from "./types";

type Permutation2DParams = { filterLeadingZero: boolean; includeDoubles: boolean };

const GUARDRAILS: FormulaGuardrails = {
    maxN: 10,
    maxK: 2,
    maxGroupsEstimate: 100
};

export const permutation2DTemplate: ComputeTemplate = {
    key: "permutation-2d",
    name: "2-Digit Permutation",
    friendlyName: "จับคู่ 2 ตัว (00-99)",
    description: "Generate 2-digit pairs (00-99) from input digits",
    formulaText: "Permutation P(n, 2) with optional filters",
    paramsSpec: {
        filterLeadingZero: { type: "boolean", required: true, defaultValue: false, description: "Exclude 01, 02... (0x)" },
        includeDoubles: { type: "boolean", required: true, defaultValue: true, description: "Include 00, 11, 22..." }
    },
    inputSpec: {
        params: {
            filterLeadingZero: { type: "boolean", required: true, defaultValue: false, description: "Exclude 01, 02... (0x)" },
            includeDoubles: { type: "boolean", required: true, defaultValue: true, description: "Include 00, 11, 22..." }
        }
    },
    outputSpec: {
        description: "List of 2-digit number strings",
        contract: "array of strings"
    },
    guardrails: GUARDRAILS,
    estimate: ({ digits, params }) => {
        const { includeDoubles } = params as Permutation2DParams;
        // Simple upper bound estimate
        let count = digits.length * digits.length;
        if (!includeDoubles) {
            count = digits.length * (digits.length - 1);
        }
        return { estimatedGroups: count };
    },
    compute: ({ digits, params }) => {
        const { filterLeadingZero, includeDoubles } = params as Permutation2DParams;
        const results: string[] = [];
        // Digits come as strings from FormulaComputeContext
        const numDigits = digits.map(d => Number(d));
        const uniqueDigits = Array.from(new Set(numDigits)).sort((a, b) => a - b);

        for (const d1 of uniqueDigits) {
            for (const d2 of uniqueDigits) {
                if (!includeDoubles && d1 === d2) continue;
                if (filterLeadingZero && d1 === 0) continue;

                results.push(`${d1}${d2}`);
            }
        }
        return results;
    }
};
