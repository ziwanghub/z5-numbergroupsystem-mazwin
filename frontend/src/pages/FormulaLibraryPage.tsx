/// <reference types="vite/client" />
import { useEffect, useMemo, useState } from "react";
import {
    AlertTriangle,
    Search,
    Plus,
    ArrowUpCircle,
    Archive,
    ArchiveX,
    RefreshCcw,
    Eye,
    Pencil,
    RotateCcw
} from "lucide-react";
import {
    getFormulaEntry,
    getLatestFormula,
    listComputeTemplates,
    listFormulaEntries,
    resolveFormulaDefinition
} from "../lib/formula-registry";
import { runFormulaWithGuardrails } from "../lib/formula-runtime";
import {
    addVersionToFormula,
    getOverlayEntries,
    resetOverlay,
    updateFormulaMeta,
    updateVersion,
    upsertFormulaEntry
} from "../lib/dev-formula-overlay";
import { FormulaEntry, FormulaVersion } from "../models/Formula";
import { Input } from "../components/ui/input";
import { MathEngine } from "../lib/math-engine";
import { Switch } from "../components/ui/switch";

type ModalType =
    | "create-formula"
    | "create-draft"
    | "promote"
    | "deprecate"
    | "archive"
    | "restore"
    | "preview"
    | "edit-meta"
    | "edit-draft"
    | null;

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

const Modal = ({
    title,
    children,
    onClose
}: {
    title: string;
    children: React.ReactNode;
    onClose: () => void;
}) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl p-5 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">{title}</h3>
                <button
                    type="button"
                    className="text-slate-400 hover:text-slate-200 text-xs"
                    onClick={onClose}
                >
                    Close
                </button>
            </div>
            {children}
        </div>
    </div>
);

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
    const [search, setSearch] = useState("");
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
    const [modal, setModal] = useState<ModalType>(null);
    const [error, setError] = useState<string | null>(null);
    const [overlayTick, setOverlayTick] = useState(0);

    const formulaEntries = useMemo(() => listFormulaEntries(), [overlayTick]);

    useEffect(() => {
        if (formulaEntries.length > 0 && !selectedId) {
            setSelectedId(formulaEntries[0].id);
        }
    }, [formulaEntries, selectedId]);

    useEffect(() => {
        if (!selectedId) return;
        const entry = getFormulaEntry(selectedId);
        if (!entry) return;
        const latest = getLatestFormula(selectedId);
        setSelectedVersion(latest?.version || entry.versions[0]?.version || null);
    }, [selectedId, overlayTick]);

    const filteredEntries = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return formulaEntries;
        return formulaEntries.filter(entry =>
            entry.displayName.toLowerCase().includes(term) ||
            entry.id.toLowerCase().includes(term) ||
            entry.tags.some(tag => tag.toLowerCase().includes(term))
        );
    }, [formulaEntries, search]);

    const selectedEntry = selectedId ? getFormulaEntry(selectedId) : null;
    const selectedVersionEntry = selectedEntry?.versions.find(version => version.version === selectedVersion) || null;
    const latestFormula = selectedId ? getLatestFormula(selectedId) : null;
    const detailFormula = selectedEntry && selectedVersionEntry ? resolveFormulaDefinition(selectedEntry, selectedVersionEntry) : latestFormula;
    const computeTemplates = listComputeTemplates();
    const overlayEntries = getOverlayEntries();

    const triggerRefresh = () => setOverlayTick(prev => prev + 1);

    const ensureOverlayEntry = (entry: FormulaEntry) => {
        const exists = overlayEntries.some(item => item.id === entry.id);
        if (exists) return;
        upsertFormulaEntry({ ...entry, versions: [...entry.versions] });
    };

    const createFormula = (payload: { id: string; name: string; description: string; tags: string[] }) => {
        const entry: FormulaEntry = {
            id: payload.id,
            displayName: payload.name,
            description: payload.description,
            tags: payload.tags,
            versions: []
        };
        upsertFormulaEntry(entry);
        triggerRefresh();
        setSelectedId(payload.id);
    };

    const createDraftVersion = (formulaId: string, computeKey: string, changeNote: string) => {
        if (selectedEntry) {
            ensureOverlayEntry(selectedEntry);
        }
        const template = computeTemplates.find(item => item.key === computeKey);
        if (!template) {
            setError("Compute template not found.");
            return;
        }
        const version: FormulaVersion = {
            formulaId,
            version: `draft-${Date.now()}`,
            status: "draft",
            computeKey,
            inputSpec: template.inputSpec,
            outputSpec: template.outputSpec,
            guardrails: template.guardrails,
            changeNote,
            createdAt: new Date().toISOString()
        };
        addVersionToFormula(formulaId, version);
        triggerRefresh();
        setSelectedVersion(version.version);
        if (isDev) window.alert(`Draft version v${version.version} created successfully!`);
    };

    const promoteDraft = (formulaId: string, draftVersion: FormulaVersion, newVersion: string) => {
        if (selectedEntry) {
            ensureOverlayEntry(selectedEntry);
        }
        const normalized = normalizeVersion(newVersion);
        updateVersion(formulaId, draftVersion.version, version => ({
            ...version,
            version: normalized,
            status: "active",
            createdAt: version.createdAt || new Date().toISOString()
        }));
        triggerRefresh();
        setSelectedVersion(normalized);
    };

    const deprecateVersion = (formulaId: string, versionId: string) => {
        if (selectedEntry) {
            ensureOverlayEntry(selectedEntry);
        }
        updateVersion(formulaId, versionId, version => ({
            ...version,
            status: "deprecated"
        }));
        triggerRefresh();
    };

    const archiveVersion = (formulaId: string, versionId: string) => {
        if (selectedEntry) {
            ensureOverlayEntry(selectedEntry);
        }
        updateVersion(formulaId, versionId, version => ({
            ...version,
            status: "archived"
        }));
        triggerRefresh();
    };

    const restoreVersion = (formulaId: string, versionId: string) => {
        if (selectedEntry) {
            ensureOverlayEntry(selectedEntry);
        }
        updateVersion(formulaId, versionId, version => ({
            ...version,
            status: "draft",
            changeNote: `Restored from ${version.status}`
        }));
        triggerRefresh();
    };

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

            {isDev && (
                <div className="border border-amber-500/30 bg-amber-500/10 text-amber-200 text-xs px-4 py-2 rounded-lg">
                    DEV ONLY — Not persisted. Changes reset on refresh.
                </div>
            )}

            {isDev && (
                <div className="flex flex-wrap gap-2 text-xs">
                    <button
                        type="button"
                        className="px-3 py-1 rounded-md bg-slate-800 text-slate-200 hover:bg-slate-700"
                        onClick={() => {
                            setError(null);
                            setModal("create-formula");
                        }}
                    >
                        <Plus className="inline w-3 h-3 mr-1" /> New Formula
                    </button>
                    <button
                        type="button"
                        className="px-3 py-1 rounded-md bg-slate-800 text-slate-200 hover:bg-slate-700"
                        onClick={() => {
                            setError(null);
                            setModal("create-draft");
                        }}
                        disabled={!selectedEntry}
                    >
                        <Plus className="inline w-3 h-3 mr-1" /> New Draft Version
                    </button>
                    <button
                        type="button"
                        className="px-3 py-1 rounded-md bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-50"
                        onClick={() => {
                            setError(null);
                            setModal("promote");
                        }}
                        disabled={!selectedVersionEntry || selectedVersionEntry.status !== "draft"}
                    >
                        <ArrowUpCircle className="inline w-3 h-3 mr-1" /> Promote Draft
                    </button>
                    <button
                        type="button"
                        className="px-3 py-1 rounded-md bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-50"
                        onClick={() => {
                            setError(null);
                            setModal("deprecate");
                        }}
                        disabled={!selectedVersionEntry || selectedVersionEntry.status !== "active"}
                    >
                        <ArchiveX className="inline w-3 h-3 mr-1" /> Deprecate
                    </button>
                    <button
                        type="button"
                        className="px-3 py-1 rounded-md bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-50"
                        onClick={() => {
                            setError(null);
                            setModal("archive");
                        }}
                        disabled={!selectedVersionEntry || selectedVersionEntry.status === "draft" || selectedVersionEntry.status === "archived"}
                    >
                        <Archive className="inline w-3 h-3 mr-1" /> Archive
                    </button>
                    <button
                        type="button"
                        className="px-3 py-1 rounded-md bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-50"
                        onClick={() => {
                            setError(null);
                            setModal("restore");
                        }}
                        disabled={!selectedVersionEntry || (selectedVersionEntry.status !== "archived" && selectedVersionEntry.status !== "deprecated")}
                    >
                        <RotateCcw className="inline w-3 h-3 mr-1" /> Restore to Draft
                    </button>
                    <button
                        type="button"
                        className="px-3 py-1 rounded-md bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-50"
                        onClick={() => {
                            setError(null);
                            setModal("preview");
                        }}
                        disabled={!selectedVersionEntry}
                    >
                        <Eye className="inline w-3 h-3 mr-1" /> Preview
                    </button>
                    <button
                        type="button"
                        className="px-3 py-1 rounded-md bg-slate-900 text-slate-400 hover:bg-slate-800"
                        onClick={() => {
                            const confirmed = window.confirm("Reset DEV overlay? Changes will be lost.");
                            if (!confirmed) return;
                            resetOverlay();
                            triggerRefresh();
                            setSelectedId(formulaEntries[0]?.id || null);
                        }}
                    >
                        <RefreshCcw className="inline w-3 h-3 mr-1" /> Reset DEV Overlay
                    </button>
                </div>
            )}

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
                    ) : !detailFormula ? (
                        <div className="text-slate-500 text-sm">Formula definition not available.</div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-white">{selectedEntry.displayName}</h3>
                                    <p className="text-sm text-slate-400">{selectedEntry.description}</p>
                                    <p className="text-xs text-slate-500 font-mono mt-2">FormulaId: {selectedEntry.id}</p>
                                    {selectedEntry.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {selectedEntry.tags.map(tag => (
                                                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {isDev && (
                                    <button
                                        type="button"
                                        className="text-xs text-slate-300 hover:text-white flex items-center gap-1"
                                        onClick={() => {
                                            setError(null);
                                            setModal("edit-meta");
                                        }}
                                    >
                                        <Pencil className="w-3 h-3" /> Edit metadata
                                    </button>
                                )}
                            </div>

                            <details open className="border border-slate-800 rounded-lg p-4 bg-slate-950/20">
                                <summary className="text-sm font-semibold text-slate-200 cursor-pointer">Overview</summary>
                                <div className="mt-3 space-y-2 text-sm text-slate-400">
                                    <div className="font-mono text-xs text-slate-300 bg-slate-900/60 rounded-md px-3 py-2">
                                        {detailFormula?.formulaText || "Formula string not available"}
                                    </div>
                                    <p>Outputs normalized result arrays for workstation panels.</p>
                                </div>
                            </details>

                            <details className="border border-slate-800 rounded-lg p-4 bg-slate-950/20">
                                <summary className="text-sm font-semibold text-slate-200 cursor-pointer">Inputs</summary>
                                <div className="mt-3">
                                    {detailFormula?.inputSpec && Object.keys(detailFormula.inputSpec.params).length > 0 ? (
                                        <div className="grid grid-cols-4 gap-3 text-xs text-slate-400">
                                            <div className="text-slate-500">Name</div>
                                            <div className="text-slate-500">Type</div>
                                            <div className="text-slate-500">Required</div>
                                            <div className="text-slate-500">Default</div>
                                            {Object.entries(detailFormula.inputSpec.params).map(([name, spec]) => (
                                                <div key={name} className="contents">
                                                    <div className="font-mono text-slate-200">{name}</div>
                                                    <div>{spec.type}</div>
                                                    <div>{spec.required ? "Yes" : "Optional"}</div>
                                                    <div>{spec.defaultValue ?? "—"}</div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-500">No parameters.</p>
                                    )}
                                </div>
                            </details>

                            <details className="border border-slate-800 rounded-lg p-4 bg-slate-950/20">
                                <summary className="text-sm font-semibold text-slate-200 cursor-pointer">Outputs</summary>
                                <div className="mt-3 text-sm text-slate-400">
                                    <p>{detailFormula?.outputSpec?.description}</p>
                                    <p className="text-xs text-slate-500 mt-1">{detailFormula?.outputSpec?.contract}</p>
                                </div>
                            </details>

                            <details className="border border-slate-800 rounded-lg p-4 bg-slate-950/20">
                                <summary className="text-sm font-semibold text-slate-200 cursor-pointer">Guardrails</summary>
                                <div className="mt-3 text-sm text-slate-400 space-y-1">
                                    <p>MAX_N: {detailFormula?.guardrails.maxN}</p>
                                    <p>MAX_K: {detailFormula?.guardrails.maxK}</p>
                                    <p>MAX_GROUPS_ESTIMATE: {detailFormula?.guardrails.maxGroupsEstimate}</p>
                                </div>
                            </details>

                            <details className="border border-slate-800 rounded-lg p-4 bg-slate-950/20">
                                <summary className="text-sm font-semibold text-slate-200 cursor-pointer">Versions</summary>
                                <div className="mt-3 space-y-2 text-sm text-slate-400">
                                    {selectedEntry.versions.map(version => {
                                        return (
                                            <button
                                                type="button"
                                                key={version.version}
                                                onClick={() => setSelectedVersion(version.version)}
                                                className={`w-full flex items-center justify-between border rounded-md px-3 py-2 ${selectedVersion === version.version
                                                    ? "border-blue-500/60 bg-slate-900 text-white"
                                                    : "border-slate-800 text-slate-300"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-slate-200">v{version.version}</span>
                                                    <StatusBadge status={version.status} />
                                                    {version.changeNote && (
                                                        <span className="text-[10px] text-slate-500">• {version.changeNote}</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {version.isLocked && (
                                                        <span className="text-[10px] text-slate-400">Locked</span>
                                                    )}
                                                    {isDev && version.status === "draft" && (
                                                        <span className="text-[10px] text-slate-400">Draft</span>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                    {isDev && selectedVersionEntry?.status === "draft" && (
                                        <button
                                            type="button"
                                            className="text-xs text-slate-300 hover:text-white flex items-center gap-1"
                                            onClick={() => {
                                                setError(null);
                                                setModal("edit-draft");
                                            }}
                                        >
                                            <Pencil className="w-3 h-3" /> Edit draft note
                                        </button>
                                    )}
                                </div>
                            </details>
                        </div>
                    )}
                </section>
            </div>

            {modal === "create-formula" && (
                <Modal title="New Formula" onClose={() => setModal(null)}>
                    <FormulaCreateForm
                        error={error}
                        onSubmit={(data) => {
                            const exists = formulaEntries.some(entry => entry.id === data.id);
                            if (exists) {
                                setError("FormulaId already exists.");
                                return;
                            }
                            createFormula(data);
                            setModal(null);
                        }}
                        onError={setError}
                    />
                </Modal>
            )}

            {modal === "edit-meta" && selectedEntry && (
                <Modal title="Edit Formula Metadata" onClose={() => setModal(null)}>
                    <FormulaMetaForm
                        entry={selectedEntry}
                        error={error}
                        onSubmit={(data) => {
                            ensureOverlayEntry(selectedEntry);
                            updateFormulaMeta(selectedEntry.id, data);
                            triggerRefresh();
                            setModal(null);
                        }}
                        onError={setError}
                    />
                </Modal>
            )}

            {modal === "create-draft" && selectedEntry && (
                <Modal title="New Draft Version" onClose={() => setModal(null)}>
                    <DraftCreateForm
                        templates={computeTemplates}
                        error={error}
                        onSubmit={(data) => {
                            createDraftVersion(selectedEntry.id, data.computeKey, data.changeNote);
                            setModal(null);
                        }}
                        onError={setError}
                    />
                </Modal>
            )}

            {modal === "edit-draft" && selectedEntry && selectedVersionEntry && (
                <Modal title="Edit Draft Note" onClose={() => setModal(null)}>
                    <DraftNoteForm
                        version={selectedVersionEntry}
                        error={error}
                        onSubmit={(data) => {
                            ensureOverlayEntry(selectedEntry);
                            updateVersion(selectedEntry.id, selectedVersionEntry.version, (version) => ({
                                ...version,
                                changeNote: data.changeNote
                            }));
                            triggerRefresh();
                            setModal(null);
                        }}
                        onError={setError}
                    />
                </Modal>
            )}

            {modal === "promote" && selectedEntry && selectedVersionEntry && (
                <Modal title="Promote Draft" onClose={() => setModal(null)}>
                    <PromoteForm
                        error={error}
                        onSubmit={(data) => {
                            if (!selectedVersionEntry.guardrails?.maxN || !selectedVersionEntry.guardrails?.maxK || !selectedVersionEntry.guardrails?.maxGroupsEstimate) {
                                setError("Guardrails missing.");
                                return;
                            }
                            if (!isSemver(data.version)) {
                                setError("Version must be semver (e.g., v1.1.0).");
                                return;
                            }
                            const normalized = normalizeVersion(data.version);
                            const exists = selectedEntry.versions.some(version => version.version === normalized);
                            if (exists) {
                                setError("Version already exists.");
                                return;
                            }
                            if (activeLatest && compareSemver(normalized, activeLatest.version) <= 0) {
                                setError("Version must be greater than latest active.");
                                return;
                            }
                            promoteDraft(selectedEntry.id, selectedVersionEntry, normalized);
                            setModal(null);
                        }}
                        onError={setError}
                    />
                </Modal>
            )}

            {modal === "deprecate" && selectedEntry && selectedVersionEntry && (
                <Modal title="Deprecate Version" onClose={() => setModal(null)}>
                    <DeprecateForm
                        version={selectedVersionEntry}
                        error={error}
                        onSubmit={() => {
                            const confirmed = window.confirm("Deprecate this version? This cannot be undone.");
                            if (!confirmed) return;
                            deprecateVersion(selectedEntry.id, selectedVersionEntry.version);
                            setModal(null);
                        }}
                    />
                </Modal>
            )}

            {modal === "archive" && selectedEntry && selectedVersionEntry && (
                <Modal title="Archive Version" onClose={() => setModal(null)}>
                    <ArchiveForm
                        version={selectedVersionEntry}
                        error={error}
                        onSubmit={() => {
                            const confirmed = window.confirm("Archive this version? Panels will be blocked.");
                            if (!confirmed) return;
                            archiveVersion(selectedEntry.id, selectedVersionEntry.version);
                            setModal(null);
                        }}
                    />
                </Modal>
            )}

            {modal === "restore" && selectedEntry && selectedVersionEntry && (
                <Modal title="Restore to Draft" onClose={() => setModal(null)}>
                    <div className="space-y-3 text-sm text-slate-300">
                        <p>Restore version <strong>v{selectedVersionEntry.version}</strong> to Draft status?</p>
                        <p className="text-xs text-slate-500">This allows you to re-validate and fix issues before re-publishing.</p>
                        <button
                            type="button"
                            className="px-3 py-2 rounded-md bg-blue-600 text-white text-xs"
                            onClick={() => {
                                restoreVersion(selectedEntry.id, selectedVersionEntry.version);
                                setModal(null);
                            }}
                        >
                            Restore to Draft
                        </button>
                    </div>
                </Modal>
            )}

            {modal === "preview" && selectedEntry && selectedVersionEntry && (
                <Modal title="Preview Formula" onClose={() => setModal(null)}>
                    <PreviewForm
                        entry={selectedEntry}
                        version={selectedVersionEntry}
                        error={error}
                        onError={setError}
                    />
                </Modal>
            )}
        </div>
    );
}

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
    templates,
    error,
    onSubmit,
    onError
}: {
    templates: ReturnType<typeof listComputeTemplates>;
    error: string | null;
    onSubmit: (data: { computeKey: string; changeNote: string }) => void;
    onError: (value: string | null) => void;
}) => {
    const [computeKey, setComputeKey] = useState(templates[0]?.key || "");
    const [changeNote, setChangeNote] = useState("");

    return (
        <div className="space-y-3 text-sm text-slate-300">
            <ErrorMessage error={error} />
            <select
                className="w-full bg-slate-900 border border-slate-700 rounded-md px-2 py-2 text-xs text-slate-200"
                value={computeKey}
                onChange={(e) => setComputeKey(e.target.value)}
            >
                {templates.map(template => (
                    <option key={template.key} value={template.key}>
                        {template.name}
                    </option>
                ))}
            </select>
            <Input placeholder="Change note (optional)" value={changeNote} onChange={(e) => setChangeNote(e.target.value)} />
            <button
                type="button"
                className="px-3 py-2 rounded-md bg-blue-600 text-white text-xs"
                onClick={() => {
                    onError(null);
                    if (!computeKey) {
                        onError("Select a compute template.");
                        return;
                    }
                    onSubmit({ computeKey, changeNote: changeNote.trim() });
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

const PreviewForm = ({
    entry,
    version,
    error,
    onError
}: {
    entry: FormulaEntry;
    version: FormulaVersion;
    error: string | null;
    onError: (value: string | null) => void;
}) => {
    const [input, setInput] = useState("");
    const [params, setParams] = useState<Record<string, unknown>>({});
    const [output, setOutput] = useState<string[]>([]);
    const [status, setStatus] = useState<string | null>(null);

    // Initialize params with defaults
    useEffect(() => {
        const defaults: Record<string, unknown> = {};
        if (version.inputSpec?.params) {
            Object.entries(version.inputSpec.params).forEach(([key, spec]) => {
                defaults[key] = spec.defaultValue ?? (spec.type === "boolean" ? false : "");
            });
        }
        setParams(defaults);
    }, [version]);

    const runPreview = () => {
        onError(null);
        let parsedParams: Record<string, unknown> = { ...params };

        // Convert types based on spec
        if (version.inputSpec?.params) {
            Object.entries(version.inputSpec.params).forEach(([key, spec]) => {
                if (spec.type === "number") {
                    parsedParams[key] = Number(parsedParams[key]);
                } else if (spec.type === "boolean") {
                    parsedParams[key] = Boolean(parsedParams[key]);
                }
            });
        }

        const definition = resolveFormulaDefinition(entry, version);
        if (!definition) {
            onError("Formula definition not available.");
            return;
        }

        const result = runFormulaWithGuardrails(definition, {
            digits: MathEngine.parseDigits(input),
            params: parsedParams
        });

        if (result.status === "blocked") {
            setStatus(result.reason || "Blocked by guardrails.");
            setOutput([]);
            return;
        }
        setStatus(null);
        setOutput(result.data.slice(0, 20));
    };

    const updateParam = (key: string, value: any) => {
        setParams(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="space-y-4 text-sm text-slate-300">
            <ErrorMessage error={error} />

            <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400">Sample Input</label>
                <Input
                    placeholder="e.g. 12345"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                />
            </div>

            <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400">Parameters</label>
                <div className="grid grid-cols-1 gap-3 bg-slate-950/30 p-3 rounded-lg border border-slate-800">
                    {version.inputSpec?.params && Object.keys(version.inputSpec.params).length > 0 ? (
                        Object.entries(version.inputSpec.params).map(([key, spec]) => {
                            const val = params[key];
                            return (
                                <div key={key} className="flex flex-col gap-1">
                                    <label className="text-[10px] text-slate-500 font-mono">{key} ({spec.type})</label>

                                    {spec.type === "boolean" ? (
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={!!val}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateParam(key, e.target.checked)}
                                            />
                                            <span className="text-xs text-slate-400">{val ? "True" : "False"}</span>
                                        </div>
                                    ) : spec.type.includes("|") ? (
                                        <select
                                            className="bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-200"
                                            value={String(val)}
                                            onChange={(e) => updateParam(key, e.target.value)}
                                        >
                                            {spec.type.split("|").map(opt => {
                                                const clean = opt.trim().replace(/['"]/g, "");
                                                return <option key={clean} value={clean}>{clean}</option>;
                                            })}
                                        </select>
                                    ) : (
                                        <Input
                                            type={spec.type === "number" ? "number" : "text"}
                                            value={String(val ?? "")}
                                            onChange={(e) => updateParam(key, e.target.value)}
                                            className="h-8 text-xs"
                                        />
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-xs text-slate-500 italic">No parameters required.</p>
                    )}
                </div>
            </div>

            <button
                type="button"
                className="w-full px-3 py-2 rounded-md bg-blue-600 text-white text-xs hover:bg-blue-500 transition-colors"
                onClick={runPreview}
            >
                Run Preview
            </button>

            {status && <p className="text-xs text-amber-300 p-2 bg-amber-900/20 rounded border border-amber-500/30">{status}</p>}

            {output.length > 0 && (
                <div className="text-xs text-slate-400 mt-2">
                    <p className="mb-1 text-slate-500">Output preview ({output.length} items):</p>
                    <div className="font-mono text-slate-300 bg-slate-950 p-2 rounded border border-slate-800 break-all">
                        {output.join(", ")}
                    </div>
                </div>
            )}
        </div>
    );
};

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
                    className={`text-sm font-medium px-4 py-1.5 rounded-full transition-all ${
                        activeTab === "registry" 
                        ? "bg-slate-800 text-white shadow-sm ring-1 ring-slate-700" 
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                    }`}
                >
                    System Registry
                </button>
                
                <button
                    onClick={() => setActiveTab("builder")}
                    className={`text-sm font-medium px-4 py-1.5 rounded-full transition-all flex items-center gap-2 ${
                        activeTab === "builder" 
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

