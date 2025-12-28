import {
    FormulaDefinition,
    FormulaEntry,
    FormulaVersion,
    FormulaVersionStatus
} from "../models/Formula";
import {
    estimateCombination,
    estimatePermutation,
    estimateWithRepeats,
    FORMULA_GUARDRAILS
} from "./formula-runtime";
import { getOverlayEntries } from "./dev-formula-overlay";

export type ComputeTemplate = any; // Placeholder after deletion

const computeTemplates: Record<string, ComputeTemplate> = {
    "z-master-universal-v1": {
        formulaText: "Z-Master Universal Generator (Engine v10: SPIC-IME/ISI).",
        paramsSpec: {
            length: { type: "number", required: true, description: "Group length." },
            allowDoubles: { type: "boolean", required: false, defaultValue: true },
            sortUnique: { type: "boolean", required: false, defaultValue: false },
            excludeFront: { type: "string", required: false, defaultValue: "" },
            excludeBack: { type: "string", required: false, defaultValue: "" }
        },
        estimate: ({ digits, params }: { digits: string[]; params: { length: number; allowDoubles?: boolean; sortUnique?: boolean } }) => {
            const size = params.length;
            if (params.sortUnique) {
                if (params.allowDoubles) {
                    return {
                        estimatedGroups: estimateWithRepeats(digits.length, size, {
                            maxN: FORMULA_GUARDRAILS.MAX_N,
                            maxK: FORMULA_GUARDRAILS.MAX_K,
                            maxGroupsEstimate: FORMULA_GUARDRAILS.MAX_GROUPS_ESTIMATE
                        })
                    };
                }
                return {
                    estimatedGroups: estimateCombination(digits.length, size, {
                        maxN: FORMULA_GUARDRAILS.MAX_N,
                        maxK: FORMULA_GUARDRAILS.MAX_K,
                        maxGroupsEstimate: FORMULA_GUARDRAILS.MAX_GROUPS_ESTIMATE
                    })
                };
            }
            if (params.allowDoubles) {
                return {
                    estimatedGroups: estimateWithRepeats(digits.length, size, {
                        maxN: FORMULA_GUARDRAILS.MAX_N,
                        maxK: FORMULA_GUARDRAILS.MAX_K,
                        maxGroupsEstimate: FORMULA_GUARDRAILS.MAX_GROUPS_ESTIMATE
                    })
                };
            }
            return {
                estimatedGroups: estimatePermutation(digits.length, size, {
                    maxN: FORMULA_GUARDRAILS.MAX_N,
                    maxK: FORMULA_GUARDRAILS.MAX_K,
                    maxGroupsEstimate: FORMULA_GUARDRAILS.MAX_GROUPS_ESTIMATE
                })
            };
        },
        compute: ({
            digits,
            params
        }: {
            digits: string[];
            params: {
                length: number;
                allowDoubles?: boolean;
                sortUnique?: boolean;
                excludeFront?: string;
                excludeBack?: string;
            };
        }) => {
            const pool = Array.from(new Set(digits));
            const size = params.length || 2;
            const isModeC = Boolean(params.sortUnique);
            const allowDoubles = params.allowDoubles !== false;

            const excludeFrontSet = new Set(
                (params.excludeFront || "")
                    .split(",")
                    .map((entry) => entry.trim())
                    .filter(Boolean)
            );
            const excludeBackSet = new Set(
                (params.excludeBack || "")
                    .split(",")
                    .map((entry) => entry.trim())
                    .filter(Boolean)
            );

            const results: string[] = [];

            const combine = (start: number, current: string[]) => {
                if (current.length === size) {
                    results.push(current.join(""));
                    return;
                }
                for (let i = start; i < pool.length; i += 1) {
                    combine(i + 1, [...current, pool[i]]);
                }
            };

            const combineWithRepeats = (start: number, current: string[]) => {
                if (current.length === size) {
                    results.push(current.join(""));
                    return;
                }
                for (let i = start; i < pool.length; i += 1) {
                    combineWithRepeats(i, [...current, pool[i]]);
                }
            };

            const permute = (current: string[], remaining: string[]) => {
                if (current.length === size) {
                    results.push(current.join(""));
                    return;
                }
                for (let i = 0; i < remaining.length; i += 1) {
                    const next = remaining[i];
                    const left = remaining.slice(0, i).concat(remaining.slice(i + 1));
                    permute([...current, next], left);
                }
            };

            const permuteWithRepeats = (current: string[]) => {
                if (current.length === size) {
                    results.push(current.join(""));
                    return;
                }
                for (let i = 0; i < pool.length; i += 1) {
                    permuteWithRepeats([...current, pool[i]]);
                }
            };

            if (isModeC) {
                if (allowDoubles) {
                    combineWithRepeats(0, []);
                } else {
                    combine(0, []);
                }
            } else if (allowDoubles) {
                permuteWithRepeats([]);
            } else {
                permute([], pool);
            }

            if (excludeFrontSet.size === 0 && excludeBackSet.size === 0) {
                return results;
            }

            return results.filter((item) => {
                if (excludeFrontSet.size > 0 && excludeFrontSet.has(item[0])) return false;
                if (excludeBackSet.size > 0 && excludeBackSet.has(item[item.length - 1])) return false;
                return true;
            });
        }
    }
};

const BASE_FORMULAS: FormulaEntry[] = [
    {
        id: "z-master-universal-v1",
        displayName: "Z-Master: Universal Generator",
        description: "Universal generator for combinations/permutations with optional exclusions.",
        tags: ["generator", "universal", "z-master", "base"],
        versions: [
            {
                formulaId: "z-master-universal-v1",
                version: "1.0.0",
                status: "active",
                isLocked: true,
                computeKey: "z-master-universal-v1",
                inputSpec: {
                    params: {
                        length: { type: "number", required: true },
                        allowDoubles: { type: "boolean", required: false },
                        sortUnique: { type: "boolean", required: false },
                        excludeFront: { type: "string", required: false },
                        excludeBack: { type: "string", required: false }
                    }
                },
                outputSpec: {
                    description: "Generated digit groups.",
                    contract: "string[]"
                },
                guardrails: {
                    maxN: FORMULA_GUARDRAILS.MAX_N,
                    maxK: FORMULA_GUARDRAILS.MAX_K,
                    maxGroupsEstimate: FORMULA_GUARDRAILS.MAX_GROUPS_ESTIMATE
                },
                changeNote: "Base executable formula for Z-Master universal generator.",
                createdAt: "2025-12-28T00:00:00+07:00"
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
