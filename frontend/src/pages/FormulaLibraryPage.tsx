/// <reference types="vite/client" />
import { useEffect, useMemo, useState } from "react";
import {
    Search,
    Pencil,
    Eye,
    Play
} from "lucide-react";
import {
    getFormulaEntry,
    getLatestFormula,
    getComputeTemplate,
    listFormulaEntries,
    resolveFormulaDefinition
} from "../lib/formula-registry";
import { formulaService } from "../services/formulaService";
import {
    // getOverlayEntries,
    // updateFormulaMeta,
    // upsertFormulaEntry
} from "../lib/dev-formula-overlay";
import { FormulaEntry, FormulaVersion, FormulaDefinition } from "../models/Formula";
import { Input } from "../components/ui/input";



const isDev = import.meta.env.DEV;

const normalizeVersion = (value: string) => value.trim().replace(/^v/i, "");

const isSemver = (value: string) => /^v?\d+\.\d+\.\d+$/.test(value);

const compareSemver = (a: string, b: string) => {
    const [aMajor, aMinor, aPatch] = normalizeVersion(a).split(".").map(Number);
    const [bMajor, bMinor, bPatch] = normalizeVersion(b).split(".").map(Number);
    if (aMajor !== bMajor) return aMajor - bMajor;
    if (aMinor !== bMinor) return aMinor - bMinor;
    return aPatch - bPatch;
};



const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
        case "active":
            return (
                <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Active
                </span>
            );
        case "draft":
            return (
                <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Draft
                </span>
            );
        case "deprecated":
            return (
                <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                    Deprecated
                </span>
            );
        case "archived":
            return (
                <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-slate-700 text-slate-400 border border-slate-600">
                    Archived
                </span>
            );
        default:
            return <span className="text-[10px] uppercase text-slate-500">{status}</span>;
    }
};

import { RecipeManager } from "../lib/recipe-manager";
import RecipeBuilder from "./RecipeBuilderPage";

// ... existing imports

export const FormulaRegistryView = () => {
    // UI State
    const [search, setSearch] = useState("");
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Data State
    const [formulaEntries, setFormulaEntries] = useState<FormulaEntry[]>([]);
    const [loading, setLoading] = useState(true);
    // const [overlayTick, setOverlayTick] = useState(0);

    // Derived Data
    // const overlayEntries = getOverlayEntries(); // Disabled for clean slate

    const fetchFormulas = async () => {
        try {
            setLoading(true);
            const backendFormulas = await formulaService.getAll();
            const mapped: FormulaEntry[] = backendFormulas.map((f: any) => ({
                id: f.formulaId,
                displayName: f.displayName,
                description: f.description,
                tags: f.tags,
                versions: f.versions || []
            }));


            setFormulaEntries(mapped);
        } catch (err) {
            console.error("Failed to fetch formulas", err);
            // Only show error if we have no data, otherwise toast?
            if (formulaEntries.length === 0) setError("Failed to load formulas.");
        } finally {
            setLoading(false);
        }
    };

    // Effects
    useEffect(() => {
        fetchFormulas();
        fetchFormulas();
    }, []);



    useEffect(() => {
    }, [formulaEntries, selectedId]);

    useEffect(() => {
        if (!selectedId) return;
        const entry = formulaEntries.find(f => f.id === selectedId);
        if (!entry) return;
        // getLatestFormula logic needs to be updated to work with local 'formulas' state or imported helper
        // For now, let's just grab the first version or calculate it.
        const latest = entry.versions.find(v => v.status === 'active'); // simplified
        setSelectedVersion(latest?.version || entry.versions[0]?.version || null);
    }, [selectedId, formulaEntries]); // Depend on formulas

    const filteredEntries = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return formulaEntries;
        return formulaEntries.filter(entry =>
            entry.displayName.toLowerCase().includes(term) ||
            entry.id.toLowerCase().includes(term) ||
            entry.tags.some(tag => tag.toLowerCase().includes(term))
        );
    }, [formulaEntries, search]);

    const selectedEntry = selectedId ? formulaEntries.find(f => f.id === selectedId) : null;
    const selectedVersionEntry = selectedEntry?.versions.find(version => version.version === selectedVersion) || null;

    const detailFormula = useMemo(() => {
        if (!selectedEntry || !selectedVersionEntry) return null;
        // Try resolving from local templates first
        const resolved = resolveFormulaDefinition(selectedEntry, selectedVersionEntry);
        if (resolved) return resolved;

        // Fallback: Construct definition from backend data (Code-First)
        return {
            id: selectedEntry.id,
            version: selectedVersionEntry.version,
            name: selectedEntry.displayName,
            description: selectedEntry.description,
            formulaText: selectedVersionEntry.logic || "// Dynamic Logic from Backend",
            tags: selectedEntry.tags,
            paramsSpec: selectedVersionEntry.inputSpec?.params || selectedVersionEntry.inputSpec?.properties,
            inputSpec: {
                ...selectedVersionEntry.inputSpec,
                params: selectedVersionEntry.inputSpec?.params || selectedVersionEntry.inputSpec?.properties || {}
            },
            outputSpec: selectedVersionEntry.outputSpec,
            guardrails: selectedVersionEntry.guardrails,
            status: selectedVersionEntry.status,
            isLocked: selectedVersionEntry.isLocked,
            computeKey: selectedVersionEntry.computeKey,
            estimate: () => ({ estimatedGroups: 0 }),
            compute: () => [] // Placeholder
        } as unknown as FormulaDefinition;
    }, [selectedEntry, selectedVersionEntry]);

    // ...

    const activeVersions = selectedEntry?.versions.filter(version => version.status === "active") || [];
    const activeLatest = activeVersions.sort((a, b) => compareSemver(b.version, a.version))[0];

    return (
        <div className="flex flex-col gap-6 h-full">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight mb-1">Formula Library</h2>
                    <p className="text-slate-400 text-sm">Read-only registry of available formulas and versions.</p>
                </div>
            </div>



            {/* Actions Toolbar removed for Read-Only Mode */}

            <div className="flex flex-1 gap-6 min-h-0">
                <section className="w-full max-w-xs bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 min-h-0">
                    <div className="relative">
                        <Search className="w-4 h-4 text-slate-500 absolute top-1/2 -translate-y-1/2 left-3" />
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search formulas..."
                            className="pl-9 bg-slate-900/70 border-slate-700 text-slate-200"
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                        {filteredEntries.length === 0 && (
                            <div className="text-sm text-slate-500 text-center py-6">
                                No formulas available.
                            </div>
                        )}
                        {filteredEntries.map(entry => {
                            const latestVersion = getLatestFormula(entry.id)?.version;
                            const isSelected = entry.id === selectedId;
                            const activeCount = entry.versions.filter(v => v.status !== "draft").length;
                            const draftCount = entry.versions.filter(v => v.status === "draft").length;
                            return (
                                <button
                                    key={entry.id}
                                    type="button"
                                    onClick={() => setSelectedId(entry.id)}
                                    className={`w-full text-left rounded-lg border px-3 py-2 transition-colors ${isSelected
                                        ? "border-blue-500/60 bg-slate-900 text-white"
                                        : "border-slate-800 bg-slate-950/30 text-slate-200 hover:border-slate-700"
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-semibold">{entry.displayName}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                                                {latestVersion ? `v${latestVersion}` : "No active"}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                        <p className="text-[11px] text-slate-500 font-mono">{entry.id}</p>
                                        <span className="text-[10px] text-slate-500">
                                            {activeCount} v / {draftCount} d
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        {entry.tags.map(tag => (
                                            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </section>

                <section className="flex-1 bg-slate-900/40 border border-slate-800 rounded-xl p-6 overflow-y-auto">
                    {!selectedEntry ? (
                        <div className="text-slate-500 text-sm">Select a formula to view details.</div>
                    ) : selectedEntry.versions.length === 0 ? (
                        <div className="text-slate-500 text-sm">No versions available for this formula.</div>
                    ) : !detailFormula || !selectedVersionEntry ? (
                        <div className="text-slate-500 text-sm">Formula definition not available.</div>
                    ) : (
                        <FormulaInteractiveDetail
                            entry={selectedEntry}
                            version={selectedVersionEntry}
                            definition={detailFormula}
                            onVersionChange={setSelectedVersion}
                            onStatusChange={async (status) => {
                                try {
                                    await formulaService.updateStatus(selectedEntry.id, selectedVersionEntry.version, status);
                                    await fetchFormulas(); // Refresh list to reflect changes
                                    // Should we toast?
                                } catch (e) {
                                    console.error("Status update failed", e);
                                    setError("Failed to update status.");
                                }
                            }}
                        />
                    )}
                </section>
            </div>

        </div>
    );
}

import { SaveRecipeModal } from "../components/recipes/SaveRecipeModal";

// ...

const FormulaInteractiveDetail = ({
    entry,
    version,
    definition,
    onVersionChange,
    onStatusChange
}: {
    entry: FormulaEntry;
    version: FormulaVersion;
    definition: FormulaDefinition;
    onVersionChange: (v: string) => void;
    onStatusChange: (status: 'active' | 'draft' | 'deprecated') => Promise<void>;
}) => {
    const [inputs, setInputs] = useState<Record<string, any>>({});
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

    // Initialize inputs when version changes
    useEffect(() => {
        const defaults: any = {};
        const params = version.inputSpec?.params || version.inputSpec?.properties;
        if (params) {
            Object.entries(params).forEach(([key, spec]) => {
                defaults[key] = (spec as any).default || (spec as any).defaultValue;
            });
        }
        setInputs(defaults);
        setResult(null); // Clear result on version change
        setError(null);
    }, [version]);

    const handleRun = () => {
        try {
            setError(null);
            if (!version.logic) throw new Error("No logic script found in this version.");

            // Check for empty inputs to avoid running prematurely
            const hasEmptyInputs = Object.values(inputs).some(val => val === '' || val === null || val === undefined);
            // Optional: Allow running if specific inputs allow empty strings, 
            // but for now, let's assume valid state requires values.
            // Actually, some formulas might work with empty input, so strict check might be annoying.
            // Let's rely on the user typing.

            const func = new Function('inputs', version.logic);
            const output = func(inputs);
            setResult(output);
        } catch (e: any) {
            setError(e.message);
        }
    };

    // Auto-Run Debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            handleRun();
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [inputs, version.logic]);

    // Check if this is the Z-Master formula
    const isZMaster = entry.id === "z-master-universal-v1";

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div>
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-white">{entry.displayName}</h3>
                        <p className="text-sm text-slate-400">{entry.description}</p>
                        <div className="flex items-center gap-4 mt-2">
                            <p className="text-xs text-slate-500 font-mono">ID: {entry.id}</p>
                            {entry.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {entry.tags.map(tag => (
                                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <select
                            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-md px-2 py-1 max-w-[120px]"
                            value={version.version}
                            onChange={(e) => onVersionChange(e.target.value)}
                        >
                            {entry.versions.map(v => (
                                <option key={v.version} value={v.version}>v{v.version} ({v.status})</option>
                            ))}
                        </select>
                        <StatusBadge status={version.status} />
                    </div>
                </div>
            </div>

            {isZMaster ? (
                <ZMasterControlPanel
                    inputs={inputs}
                    onChange={(key, val) => setInputs(prev => ({ ...prev, [key]: val }))}
                />
            ) : (
                /* Standard Inputs & Action Panel */
                <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-medium text-slate-200">Configuration</h4>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1.5 uppercase font-medium tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Auto-Compute Enabled
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {(version.inputSpec?.params || version.inputSpec?.properties) &&
                            Object.entries(version.inputSpec?.params || version.inputSpec?.properties || {}).map(([key, spec]) => {
                                const isBoolean = (spec as any).type === 'boolean';
                                return (
                                    <div key={key} className="space-y-1.5">
                                        <label className="text-xs font-medium text-slate-400 font-mono">
                                            {(spec as any).title || (spec as any).description || key}
                                        </label>
                                        {isBoolean ? (
                                            <div className="flex items-center h-9">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!inputs[key]}
                                                        onChange={(e) => setInputs(prev => ({ ...prev, [key]: e.target.checked }))}
                                                        className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500/20"
                                                    />
                                                    <span className="text-xs text-slate-300 select-none">
                                                        {(inputs[key] ? "Enabled" : "Disabled")}
                                                    </span>
                                                </label>
                                            </div>
                                        ) : (
                                            <Input
                                                value={inputs[key] || ''}
                                                onChange={(e) => setInputs(prev => ({ ...prev, [key]: e.target.value }))}
                                                placeholder={String((spec as any).default || (spec as any).defaultValue || '')}
                                                className="bg-slate-950 border-slate-700 h-9 text-xs"
                                            />
                                        )}
                                    </div>
                                );
                            })}
                    </div>
                </div>
            )}


            {/* Output Section */}
            < div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-5 min-h-[120px]" >
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-slate-200">Output Result</h4>
                    {result && Array.isArray(result) && (
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
                            Total: {result.length} items
                        </span>
                    )}
                </div>

                {
                    error && (
                        <div className="p-3 bg-red-900/20 border border-red-900/50 rounded-md text-red-200 text-xs mb-3">
                            {error}
                        </div>
                    )
                }

                {
                    result ? (
                        Array.isArray(result) ? (
                            <div className="flex flex-wrap gap-2 max-h-[400px] overflow-y-auto content-start p-1">
                                {result.map((item: any, idx: number) => (
                                    <span key={idx} className="bg-slate-800 text-emerald-400 font-mono text-xs px-2 py-1 rounded border border-slate-700/50 shadow-sm">
                                        {String(item)}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <pre className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-emerald-400 text-xs font-mono overflow-auto max-h-80 shadow-inner">
                                {JSON.stringify(result, null, 2)}
                            </pre>
                        )
                    ) : (
                        <div className="flex flex-col items-center justify-center py-6 text-slate-600 space-y-2 border-2 border-dashed border-slate-800 rounded-lg">
                            <Play className="w-8 h-8 text-slate-700 mb-2 opacity-50" />
                            <p className="text-sm font-medium">Ready to calculate</p>
                            <p className="text-xs font-mono text-slate-700">Modify inputs to trigger auto-calculation</p>
                        </div>
                    )
                }
            </div >


            {/* Deploy Action (Lifecycle) - REPLACED WITH RECIPE CREATE */}
            <div className="bg-emerald-950/20 border border-emerald-900/50 rounded-xl p-4 flex items-center justify-between">
                <div>
                    <h4 className="text-sm font-semibold text-emerald-400">Save as Custom Recipe</h4>
                    <p className="text-xs text-emerald-600/80 mt-1">
                        Create a one-click shortcut for this configuration on your Workstation.
                    </p>
                </div>
                <button
                    onClick={() => setIsSaveModalOpen(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/20 active:scale-95 transition-all"
                >
                    ✨ Create Formula
                </button>
            </div>

            <SaveRecipeModal
                isOpen={isSaveModalOpen}
                onClose={() => setIsSaveModalOpen(false)}
                config={inputs}
                baseFormulaId={entry.id}
                resultCount={result ? result.length : 0}
                defaultDescription={
                    // Generate Logic Tags
                    `Input: ${inputs.digits || "0123456789"}\n` +
                    `Result: ${result ? result.slice(0, 10).join(', ') : ""}...\n` +
                    `Logic: ${inputs.length || 2} Digits, ${inputs.allowDoubles ? "Allow Double" : "No Double"}, ${inputs.sortUnique ? "Set (C)" : "Sort (P)"}`
                }
            />


            {/* Technical Details (Accordion) */}
            <details className="group border border-slate-800 rounded-lg bg-slate-950/20">
                <summary className="flex items-center justify-between p-4 cursor-pointer text-sm font-medium text-slate-400 group-open:text-slate-200 hover:text-slate-300">
                    <span>Technical Spec & Logic</span>
                </summary>
                <div className="p-4 border-t border-slate-800 space-y-4">
                    {/* Logic Code */}
                    <div>
                        <p className="text-xs text-slate-500 mb-1">Logic Code</p>
                        <div className="font-mono text-xs text-blue-300 bg-slate-950 p-3 rounded-md overflow-x-auto border border-slate-800">
                            {definition.formulaText || "// Logic not available"}
                        </div>
                    </div>

                    {/* Guardrails */}
                    <div className="grid grid-cols-3 gap-4 border-t border-slate-800/50 pt-4">
                        <div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Max N</p>
                            <p className="text-sm font-mono text-slate-300">{definition.guardrails.maxN}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Max K</p>
                            <p className="text-sm font-mono text-slate-300">{definition.guardrails.maxK}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Groups Est</p>
                            <p className="text-sm font-mono text-slate-300">{definition.guardrails.maxGroupsEstimate}</p>
                        </div>
                    </div>
                </div>
            </details>
        </div >
    );
};


const SegmentedToggle = ({
    options,
    value,
    onChange
}: {
    options: { label: string; value: any }[];
    value: any;
    onChange: (val: any) => void;
}) => {
    return (
        <div className="flex p-1 bg-slate-900 rounded-lg border border-slate-700 w-full relative">
            {options.map((opt, idx) => {
                const isActive = value === opt.value;
                return (
                    <button
                        key={idx}
                        onClick={() => onChange(opt.value)}
                        className={`flex-1 text-[10px] sm:text-xs py-1.5 rounded-md font-medium transition-all relative z-10 ${isActive
                            ? "bg-blue-600 text-white shadow-sm"
                            : "text-slate-400 hover:text-slate-200"
                            }`}
                    >
                        {opt.label}
                    </button>
                );
            })}
        </div>
    );
};

const ZMasterControlPanel = ({
    inputs,
    onChange
}: {
    inputs: any;
    onChange: (key: string, val: any) => void;
}) => {
    // Defaults if undefined
    const length = inputs['length'] || 2;
    const allowDouble = inputs['allowDoubles'] !== false; // Default True
    const isSetMode = inputs['sortUnique'] === true; // Default False (Sort P)

    // Helper to toggle digit in exclusion string
    const toggleExclude = (field: 'excludeFront' | 'excludeBack', digit: string) => {
        const current = (inputs[field] || "").toString();
        const parts = current.split(',').map((s: string) => s.trim()).filter(Boolean);
        const set = new Set(parts);
        if (set.has(digit)) set.delete(digit);
        else set.add(digit);
        onChange(field, Array.from(set).join(','));
    };

    const ExcludeNumpad = ({ field, label }: { field: 'excludeFront' | 'excludeBack', label: string }) => {
        const currentStr = (inputs[field] || "").toString();
        const parts = currentStr.split(',').map((s: string) => s.trim());
        const activeSet = new Set(parts);

        return (
            <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400 font-mono">{label}</label>
                <div className="grid grid-cols-5 gap-1">
                    {['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => {
                        const active = activeSet.has(d);
                        return (
                            <button
                                key={d}
                                onClick={() => toggleExclude(field, d)}
                                className={`text-[10px] font-mono h-6 rounded border transition-all ${active
                                    ? "bg-red-900/40 border-red-500/50 text-red-200"
                                    : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500"
                                    }`}
                            >
                                {d}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="bg-slate-950 border border-blue-900/30 rounded-xl p-5 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

            <div className="flex items-center justify-between mb-5 relative z-10">
                <div>
                    <h4 className="text-sm font-bold text-blue-100 flex items-center gap-2">
                        <span className="text-blue-500">🎛️</span> Standard Generator
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Z-Master v2 Core</p>
                </div>
                <button
                    onClick={() => {
                        // Reset defaults
                        onChange('length', 2);
                        onChange('allowDoubles', true);
                        onChange('sortUnique', false);
                        onChange('excludeFront', "");
                        onChange('excludeBack', "");
                    }}
                    className="text-[10px] text-slate-500 hover:text-slate-300 underline"
                >
                    Reset Defaults
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                {/* Left Col: Core Settings */}
                <div className="space-y-5">

                    {/* Test Input: Digits */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-400 font-mono">Base Digits</label>
                        <Input
                            value={inputs['digits'] || ''}
                            onChange={(e) => onChange('digits', e.target.value)}
                            placeholder="0123456789"
                            className="bg-slate-900 border-slate-700 h-9 text-xs font-mono tracking-widest"
                        />
                    </div>

                    {/* Controls Config (Segmented Toggles) */}
                    <div className="space-y-4">
                        {/* 1. Length */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-500 uppercase tracking-widest">Length</label>
                            <SegmentedToggle
                                value={Number(length)}
                                onChange={(val) => onChange('length', val)}
                                options={[
                                    { label: '2 Digits', value: 2 },
                                    { label: '3 Digits', value: 3 }
                                ]}
                            />
                        </div>

                        {/* 2. Doubles Logic */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-500 uppercase tracking-widest">Doubles Logic</label>
                            <SegmentedToggle
                                value={allowDouble}
                                onChange={(val) => onChange('allowDoubles', val)}
                                options={[
                                    { label: 'No Double (Strict)', value: false },
                                    { label: 'Allow Double', value: true }
                                ]}
                            />
                        </div>

                        {/* 3. Mode (Set vs Sort) */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-500 uppercase tracking-widest">Output Mode</label>
                            <SegmentedToggle
                                value={isSetMode}
                                onChange={(val) => onChange('sortUnique', val)}
                                options={[
                                    { label: 'Sort (P)', value: false }, // Permutation (21, 12)
                                    { label: 'Set (C)', value: true }   // Combination (12 only)
                                ]}
                            />
                        </div>
                    </div>
                </div>

                {/* Right Col: Exclusions */}
                <div className="space-y-4">
                    <ExcludeNumpad field="excludeFront" label="Exclude Front Digit" />
                    <ExcludeNumpad field="excludeBack" label="Exclude Back Digit" />
                </div>
            </div>
        </div>
    );
};

const ErrorMessage = ({ error }: { error: string | null }) =>
    error ? <p className="text-xs text-red-400 mb-2">{error}</p> : null;

const FormulaCreateForm = ({
    error,
    onSubmit,
    onError
}: {
    error: string | null;
    onSubmit: (data: { id: string; name: string; description: string; tags: string[] }) => void;
    onError: (value: string | null) => void;
}) => {
    const [id, setId] = useState("");
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [tags, setTags] = useState("");

    return (
        <div className="space-y-3 text-sm text-slate-300">
            <ErrorMessage error={error} />
            <Input placeholder="formula-id" value={id} onChange={(e) => setId(e.target.value)} />
            <Input placeholder="Display name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
            <Input placeholder="Tags (comma separated)" value={tags} onChange={(e) => setTags(e.target.value)} />
            <button
                type="button"
                className="px-3 py-2 rounded-md bg-blue-600 text-white text-xs"
                onClick={() => {
                    onError(null);
                    const trimmedId = id.trim();
                    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(trimmedId)) {
                        onError("FormulaId must be kebab-case.");
                        return;
                    }
                    if (!name.trim()) {
                        onError("Display name is required.");
                        return;
                    }
                    onSubmit({
                        id: trimmedId,
                        name: name.trim(),
                        description: description.trim(),
                        tags: tags.split(",").map(tag => tag.trim()).filter(Boolean)
                    });
                }}
            >
                Create Formula
            </button>
        </div>
    );
};

const FormulaMetaForm = ({
    entry,
    error,
    onSubmit,
    onError
}: {
    entry: FormulaEntry;
    error: string | null;
    onSubmit: (data: { displayName: string; description: string; tags: string[] }) => void;
    onError: (value: string | null) => void;
}) => {
    const [name, setName] = useState(entry.displayName);
    const [description, setDescription] = useState(entry.description);
    const [tags, setTags] = useState(entry.tags.join(", "));

    return (
        <div className="space-y-3 text-sm text-slate-300">
            <ErrorMessage error={error} />
            <Input placeholder="Display name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
            <Input placeholder="Tags (comma separated)" value={tags} onChange={(e) => setTags(e.target.value)} />
            <button
                type="button"
                className="px-3 py-2 rounded-md bg-blue-600 text-white text-xs"
                onClick={() => {
                    onError(null);
                    if (!name.trim()) {
                        onError("Display name is required.");
                        return;
                    }
                    onSubmit({
                        displayName: name.trim(),
                        description: description.trim(),
                        tags: tags.split(",").map(tag => tag.trim()).filter(Boolean)
                    });
                }}
            >
                Save Metadata
            </button>
        </div>
    );
};

const DraftCreateForm = ({
    formulas,
    error,
    onSubmit,
    onError
}: {
    formulas: FormulaEntry[];
    error: string | null;
    onSubmit: (data: { computeKey: string; changeNote: string }) => void;
    onError: (value: string | null) => void;
}) => {
    const [selectedFormulaId, setSelectedFormulaId] = useState(formulas[0]?.id || "");
    const [changeNote, setChangeNote] = useState("");

    // Update default if formulas change
    useEffect(() => {
        if (!selectedFormulaId && formulas.length > 0) {
            setSelectedFormulaId(formulas[0].id);
        }
    }, [formulas]);

    return (
        <div className="space-y-3 text-sm text-slate-300">
            <ErrorMessage error={error} />
            <div className="space-y-1">
                <label className="text-xs text-slate-500">Base Formula (Template)</label>
                <select
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-2 py-2 text-xs text-slate-200"
                    value={selectedFormulaId}
                    onChange={(e) => setSelectedFormulaId(e.target.value)}
                >
                    {formulas.map(formula => {
                        const latest = getLatestFormula(formula.id);
                        return (
                            <option key={formula.id} value={formula.id}>
                                {formula.displayName} {latest ? `(v${latest.version})` : ""}
                            </option>
                        );
                    })}
                </select>
            </div>
            <Input placeholder="Change note (optional)" value={changeNote} onChange={(e) => setChangeNote(e.target.value)} />
            <button
                type="button"
                className="px-3 py-2 rounded-md bg-blue-600 text-white text-xs"
                onClick={() => {
                    onError(null);
                    const targetFormula = formulas.find(f => f.id === selectedFormulaId);
                    if (!targetFormula) {
                        onError("Select a base formula.");
                        return;
                    }
                    // We need the computeKey from the latest active version of the selected formula
                    const latest = getLatestFormula(targetFormula.id);
                    if (!latest) {
                        onError("Selected formula has no active version to use as template.");
                        return;
                    }

                    onSubmit({ computeKey: latest.computeKey, changeNote: changeNote.trim() });
                }}
            >
                Create Draft
            </button>
        </div>
    );
};

const DraftNoteForm = ({
    version,
    error,
    onSubmit,
    onError
}: {
    version: FormulaVersion;
    error: string | null;
    onSubmit: (data: { changeNote: string }) => void;
    onError: (value: string | null) => void;
}) => {
    const [changeNote, setChangeNote] = useState(version.changeNote || "");

    return (
        <div className="space-y-3 text-sm text-slate-300">
            <ErrorMessage error={error} />
            <Input placeholder="Change note" value={changeNote} onChange={(e) => setChangeNote(e.target.value)} />
            <button
                type="button"
                className="px-3 py-2 rounded-md bg-blue-600 text-white text-xs"
                onClick={() => {
                    onError(null);
                    onSubmit({ changeNote: changeNote.trim() });
                }}
            >
                Save Note
            </button>
        </div>
    );
};

const PromoteForm = ({
    error,
    onSubmit,
    onError
}: {
    error: string | null;
    onSubmit: (data: { version: string }) => void;
    onError: (value: string | null) => void;
}) => {
    const [version, setVersion] = useState("");
    return (
        <div className="space-y-3 text-sm text-slate-300">
            <ErrorMessage error={error} />
            <Input placeholder="v1.1.0" value={version} onChange={(e) => setVersion(e.target.value)} />
            <button
                type="button"
                className="px-3 py-2 rounded-md bg-blue-600 text-white text-xs"
                onClick={() => {
                    onError(null);
                    onSubmit({ version });
                }}
            >
                Promote
            </button>
        </div>
    );
};

const DeprecateForm = ({
    version,
    error,
    onSubmit
}: {
    version: FormulaVersion;
    error: string | null;
    onSubmit: () => void;
}) => (
    <div className="space-y-3 text-sm text-slate-300">
        <ErrorMessage error={error} />
        <p>Deprecate version v{version.version}?</p>
        <button type="button" className="px-3 py-2 rounded-md bg-red-600 text-white text-xs" onClick={onSubmit}>
            Deprecate
        </button>
    </div>
);

const ArchiveForm = ({
    version,
    error,
    onSubmit
}: {
    version: FormulaVersion;
    error: string | null;
    onSubmit: () => void;
}) => (
    <div className="space-y-3 text-sm text-slate-300">
        <ErrorMessage error={error} />
        <p>Archive version v{version.version}?</p>
        <button type="button" className="px-3 py-2 rounded-md bg-red-700 text-white text-xs" onClick={onSubmit}>
            Archive
        </button>
    </div>
);



// End of read-only component

// Wrapper Component with Tabs
export default function FormulaLibraryPage() {
    const [activeTab, setActiveTab] = useState<"registry" | "builder">("registry");

    return (
        <div className="h-full flex flex-col bg-[#0f172a]">
            {/* TAB HEADER */}
            <div className="h-14 border-b border-slate-800 flex items-center px-6 gap-6 bg-slate-950/50 backdrop-blur">
                <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <span className="text-blue-500">⚡</span> Formula Engine
                </h1>
                <div className="h-6 w-[1px] bg-slate-700 mx-2"></div>

                <button
                    onClick={() => setActiveTab("registry")}
                    className={`text-sm font-medium px-4 py-1.5 rounded-full transition-all ${activeTab === "registry"
                        ? "bg-slate-800 text-white shadow-sm ring-1 ring-slate-700"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                        }`}
                >
                    System Registry
                </button>

                <button
                    onClick={() => setActiveTab("builder")}
                    className={`text-sm font-medium px-4 py-1.5 rounded-full transition-all flex items-center gap-2 ${activeTab === "builder"
                        ? "bg-blue-600/10 text-blue-400 shadow-sm ring-1 ring-blue-600/30"
                        : "text-slate-400 hover:text-blue-300 hover:bg-slate-800/50"
                        }`}
                >
                    Recipe Studio
                    <span className="text-[10px] bg-blue-600 text-white px-1.5 rounded-full">New</span>
                </button>
            </div>

            {/* TAB CONTENT */}
            <div className="flex-1 overflow-hidden relative">
                {activeTab === "registry" ? (
                    <FormulaRegistryView />
                ) : (
                    <RecipeBuilder />
                )}
            </div>
        </div>
    );
}

