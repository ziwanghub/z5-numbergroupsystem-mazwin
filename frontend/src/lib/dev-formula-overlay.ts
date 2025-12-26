import { FormulaEntry, FormulaVersion } from "../models/Formula";

const STORAGE_KEY = "z5_formula_overlay";
const isDev = import.meta.env.DEV;

let overlayCache: FormulaEntry[] = [];

const loadOverlay = () => {
    if (!isDev) return [];
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as FormulaEntry[];
        return parsed;
    } catch {
        return [];
    }
};

const saveOverlay = (entries: FormulaEntry[]) => {
    if (!isDev) return;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
};

overlayCache = loadOverlay();

export const getOverlayEntries = () => overlayCache;

export const setOverlayEntries = (entries: FormulaEntry[]) => {
    overlayCache = entries;
    saveOverlay(entries);
};

export const resetOverlay = () => {
    overlayCache = [];
    saveOverlay([]);
};

export const upsertFormulaEntry = (entry: FormulaEntry) => {
    const existingIndex = overlayCache.findIndex(item => item.id === entry.id);
    if (existingIndex >= 0) {
        overlayCache[existingIndex] = entry;
    } else {
        overlayCache = [...overlayCache, entry];
    }
    saveOverlay(overlayCache);
};

export const updateFormulaMeta = (formulaId: string, data: Partial<FormulaEntry>) => {
    overlayCache = overlayCache.map(entry => {
        if (entry.id !== formulaId) return entry;
        return {
            ...entry,
            displayName: data.displayName ?? entry.displayName,
            description: data.description ?? entry.description,
            tags: data.tags ?? entry.tags
        };
    });
    saveOverlay(overlayCache);
};

export const addVersionToFormula = (formulaId: string, version: FormulaVersion) => {
    overlayCache = overlayCache.map(entry => {
        if (entry.id !== formulaId) return entry;
        return {
            ...entry,
            versions: [...entry.versions, version]
        };
    });
    saveOverlay(overlayCache);
};

export const updateVersion = (formulaId: string, versionId: string, updater: (version: FormulaVersion) => FormulaVersion) => {
    overlayCache = overlayCache.map(entry => {
        if (entry.id !== formulaId) return entry;
        return {
            ...entry,
            versions: entry.versions.map(version => (version.version === versionId ? updater(version) : version))
        };
    });
    saveOverlay(overlayCache);
};
