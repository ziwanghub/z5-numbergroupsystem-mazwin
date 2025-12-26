import {
    FormulaDefinition,
    FormulaEntry,
    FormulaVersion,
    FormulaVersionStatus
} from "../models/Formula";
import { getOverlayEntries } from "./dev-formula-overlay";
import {
    digitGroupingTemplate,
    staticGroupTemplate,
    permutation2DTemplate,
    pipelineRunnerTemplate
} from "./compute-modules";
import type { ComputeTemplate } from "./compute-modules";

export { ComputeTemplate };

const computeTemplates: Record<string, ComputeTemplate> = {
    [digitGroupingTemplate.key]: digitGroupingTemplate,
    [staticGroupTemplate.key]: staticGroupTemplate,
    [permutation2DTemplate.key]: permutation2DTemplate,
    [pipelineRunnerTemplate.key]: pipelineRunnerTemplate
};

const BASE_FORMULAS: FormulaEntry[] = [
    {
        id: "digits-group",
        displayName: "Digit Grouping",
        description: "Combination/Permutation grouping with optional repeats",
        tags: ["dynamic", "combinatorics"],
        versions: [
            {
                formulaId: "digits-group",
                version: "1.0.0",
                status: "active",
                computeKey: "digits-group",
                inputSpec: computeTemplates["digits-group"].inputSpec,
                outputSpec: computeTemplates["digits-group"].outputSpec,
                guardrails: computeTemplates["digits-group"].guardrails,
                isLocked: false,
                changeNote: "Initial release",
                createdAt: new Date().toISOString()
            }
        ]
    },
    {
        id: "static-group",
        displayName: "Static Group",
        description: "Static preset groups",
        tags: ["static", "preset"],
        versions: [
            {
                formulaId: "static-group",
                version: "1.0.0",
                status: "active",
                computeKey: "static-group",
                inputSpec: computeTemplates["static-group"].inputSpec,
                outputSpec: computeTemplates["static-group"].outputSpec,
                guardrails: computeTemplates["static-group"].guardrails,
                isLocked: false,
                changeNote: "Initial release",
                createdAt: new Date().toISOString()
            }
        ]
    }
];

const compareSemver = (a: string, b: string) => {
    const [aMajor, aMinor, aPatch] = a.replace(/^v/, "").split(".").map(Number);
    const [bMajor, bMinor, bPatch] = b.replace(/^v/, "").split(".").map(Number);
    if (aMajor !== bMajor) return bMajor - aMajor;
    if (aMinor !== bMinor) return bMinor - aMinor;
    return bPatch - aPatch;
};

const mergeEntries = (base: FormulaEntry[], overlay: FormulaEntry[]) => {
    const map = new Map<string, FormulaEntry>();
    base.forEach(entry => {
        map.set(entry.id, { ...entry, versions: [...entry.versions] });
    });
    overlay.forEach(entry => {
        const existing = map.get(entry.id);
        if (!existing) {
            map.set(entry.id, { ...entry, versions: [...entry.versions] });
            return;
        }
        const versionMap = new Map(existing.versions.map(version => [version.version, version]));
        entry.versions.forEach(version => {
            versionMap.set(version.version, version);
        });
        map.set(entry.id, {
            ...existing,
            displayName: entry.displayName,
            description: entry.description,
            tags: entry.tags,
            versions: Array.from(versionMap.values())
        });
    });
    return Array.from(map.values());
};

export const listFormulaEntries = (): FormulaEntry[] => {
    const overlay = getOverlayEntries();
    return mergeEntries(BASE_FORMULAS, overlay).sort((a, b) => a.displayName.localeCompare(b.displayName));
};

export const getFormulaEntry = (formulaId: string): FormulaEntry | null => {
    return listFormulaEntries().find(entry => entry.id === formulaId) || null;
};

export const getLatestFormula = (formulaId: string): FormulaDefinition | null => {
    const entry = getFormulaEntry(formulaId);
    if (!entry) return null;
    const activeVersions = entry.versions.filter(version => version.status === "active");
    if (activeVersions.length === 0) return null;
    const latest = [...activeVersions].sort((a, b) => compareSemver(a.version, b.version))[0];
    return resolveFormulaDefinition(entry, latest);
};

export const getFormula = (formulaId: string, version?: string): FormulaDefinition | null => {
    if (!version) return null;
    const entry = getFormulaEntry(formulaId);
    if (!entry) return null;
    const target = entry.versions.find(item => item.version === version);
    if (!target) {
        return null;
    }
    return resolveFormulaDefinition(entry, target);
};

export const resolveFormulaDefinition = (entry: FormulaEntry, version: FormulaVersion): FormulaDefinition | null => {
    const template = computeTemplates[version.computeKey];
    if (!template) return null;
    return {
        id: entry.id,
        version: version.version,
        name: entry.displayName,
        description: entry.description,
        formulaText: template.formulaText,
        tags: entry.tags,
        paramsSpec: template.paramsSpec,
        inputSpec: version.inputSpec,
        outputSpec: version.outputSpec,
        guardrails: version.guardrails,
        status: version.status,
        isLocked: version.isLocked,
        computeKey: version.computeKey,
        estimate: template.estimate,
        compute: template.compute
    };
};

export const listComputeTemplates = () => Object.values(computeTemplates);

export const getComputeTemplate = (key: string) => computeTemplates[key] || null;

export const isActiveOrDeprecated = (status: FormulaVersionStatus) => status === "active" || status === "deprecated";
