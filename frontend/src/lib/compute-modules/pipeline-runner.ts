/**
 * ARCHITECTURE DESIGN: PIPELINE RUNNER (Phase 2)
 * 
 * Goal: Support "Chainable Formulas" where output of Module A -> Input of Module B.
 * 
 * Pattern: Tube / Pipe
 * Structure:
 * - A Pipeline is a Formula that contains a list of "Steps".
 * - Each Step references a "Module Key" and has its own "Params".
 * 
 * Data Flow:
 * Input (Digits/String) -> [Step 1: Generator] -> Result A -> [Step 2: Filter] -> Result B -> Output
 * 
 * Interfaces:
 */

import { FormulaComputeContext, FormulaGuardrails } from "../../models/Formula";
import { EstimateInfo } from "../../models/Formula";
import { ComputeTemplate } from "./types";
import { getComputeTemplate } from "../formula-registry";

export interface PipelineStep {
    stepId: string;
    moduleKey: string; // e.g., "digits-group", "filter-exclude"
    params: Record<string, any>;
}

export type PipelineParams = {
    steps: PipelineStep[];
};

export const pipelineRunnerTemplate: ComputeTemplate = {
    key: "pipeline-runner",
    name: "Formula Pipeline",
    friendlyName: "สูตรผสม (Pipeline)",
    description: "Execute multiple modules in sequence",
    formulaText: "Step 1 | Step 2 | ... | Step N",

    // Params for the pipeline itself (the container)
    // The actual steps are dynamic, so this might be a JSON blob or specific UI builder structure
    paramsSpec: {
        steps: { type: "json", required: true, description: "List of pipeline steps" }
    },

    // Input/Output specs depend on the pipeline content, 
    // but generally we assume Input = Digits, Output = Array<string>
    inputSpec: { params: {} },
    outputSpec: { description: "Final pipeline result", contract: "array of string" },

    guardrails: { maxN: 100, maxK: 10, maxGroupsEstimate: 100000 },

    estimate: ({ digits, params }: FormulaComputeContext): EstimateInfo => {
        // Logic: 
        // 1. Get first step (Generator)
        // 2. Estimate its output
        // 3. Apply reduction factors of subsequent filters (heuristics)
        return { estimatedGroups: -1, reason: "Pipeline estimation pending implementation" };
    },

    compute: ({ digits, params }: FormulaComputeContext): string[] => {
        const { steps } = params as PipelineParams;
        if (!steps || steps.length === 0) return [];

        let currentData: string[] = digits; // Initial input

        // Execute Steps
        for (const step of steps) {
            const template = getComputeTemplate(step.moduleKey);
            if (!template) throw new Error(`Module ${step.moduleKey} not found`);

            // RUN STEP
            // Note: Some modules are "Generators" (take raw digits), 
            // others are "Filters" (take array of strings).
            // We need to standardize interface: 
            // - Generator: raw -> array
            // - Filter: array -> array
            // Assuming 'digits' in context can be overloaded, or we create a new context type.

            // For now, assume all modules conform to FormulaDefinition['compute']: (ctx) -> string[]
            // We feed 'currentData' as 'digits' to the next step?
            // Technically 'digits' passed to standard formulas is expected to be [0-9].
            // If Step 1 outputs "12", "13", and Step 2 is a filter, Step 2 receives ["12", "13"].

            currentData = template.compute({
                digits: currentData, // Pipe previous output as input source
                params: step.params
            });
        }

        return currentData;
    }
};
