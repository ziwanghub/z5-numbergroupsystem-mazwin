import { FormulaGuardrails, FormulaComputeContext } from "../../models/Formula";
import { STATIC_RULES } from "../../data/static-rules";
import { ComputeTemplate } from "./types";

type StaticParams = { groupKey: keyof typeof STATIC_RULES };

const DEFAULT_GUARDRAILS: FormulaGuardrails = {
    maxN: 10,
    maxK: 6,
    maxGroupsEstimate: 50000
};

export const staticGroupTemplate: ComputeTemplate = {
    key: "static-group",
    name: "Static Group",
    friendlyName: "ชุดเลขสำเร็จรูป (Static)",
    description: "Static preset groups",
    formulaText: "Preset list lookup",
    paramsSpec: {
        groupKey: { type: "string", required: true, description: "Static group key" }
    },
    inputSpec: {
        params: {
            groupKey: { type: "string", required: true, description: "Static group key" }
        }
    },
    outputSpec: {
        description: "Static result list from preset catalog",
        contract: "array of strings, total count"
    },
    guardrails: DEFAULT_GUARDRAILS,
    estimate: ({ params }: FormulaComputeContext) => {
        const { groupKey } = params as StaticParams;
        const group = STATIC_RULES[groupKey];
        return { estimatedGroups: group ? group.data.length : 0 };
    },
    compute: ({ params }: FormulaComputeContext) => {
        const { groupKey } = params as StaticParams;
        const group = STATIC_RULES[groupKey];
        return group ? group.data : [];
    }
};
