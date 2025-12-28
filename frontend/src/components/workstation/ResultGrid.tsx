import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { CalculationResult } from "../../models/Calculation";
import { Button } from "../ui/button";
import { Copy, Trash2 } from "lucide-react";
import { useCalculationContext } from "../../context/CalculationContext";
import { toast } from "sonner";
import { grantConsent, hasConsent } from "../../lib/formula-consent";

interface ResultGridProps {
    results: CalculationResult[];
    densityMode: "compact" | "comfort";
}

export function ResultGrid({ results, densityMode }: ResultGridProps) {
    const { removeWidget, widgets, isReady, setLastCopy } = useCalculationContext();
    const [highlightedPanelId, setHighlightedPanelId] = useState<string | null>(null);
    const [pendingCopy, setPendingCopy] = useState<{
        panelId: string;
        panelName: string;
        data: string[];
        consentKey: string;
    } | null>(null);
    const highlightTimeoutRef = useRef<number | null>(null);
    const archivedNoticeRef = useRef<Set<string>>(new Set());

    const handleCopy = async (
        panelId: string,
        panelName: string,
        data: string[],
        consentKey: string,
        capabilities?: CalculationResult["capabilities"],
        consentGranted?: boolean
    ) => {
        const canCopy = capabilities?.canCopy || (capabilities?.requiresConsent && consentGranted);
        if (!isReady || data.length === 0 || !canCopy) {
            toast.warning("Blocked", {
                description: capabilities?.message || "Result not ready for copy.",
                id: "copy-feedback"
            });
            return;
        }

        try {
            const payload = data.join(", ");
            await navigator.clipboard.writeText(payload);

            setLastCopy({
                panelId,
                panelName,
                copiedAt: Date.now()
            });

            toast.success("✓ Copied", {
                description: panelName,
                id: "copy-feedback"
            });

            setHighlightedPanelId(panelId);
            if (highlightTimeoutRef.current) {
                window.clearTimeout(highlightTimeoutRef.current);
            }
            highlightTimeoutRef.current = window.setTimeout(() => {
                setHighlightedPanelId(null);
                highlightTimeoutRef.current = null;
            }, 250);
        } catch (error) {
            toast.error("Copy failed", {
                description: "Clipboard permission denied.",
                id: "copy-feedback"
            });
        }
    };

    const panelGap = densityMode === "compact" ? "gap-3" : "gap-5";
    const headerPadding = densityMode === "compact" ? "pb-1" : "pb-3";
    const contentPadding = densityMode === "compact" ? "p-3" : "p-5";
    const copyButtonClasses = densityMode === "compact"
        ? "h-5 w-5 text-slate-500 hover:text-slate-200 hover:bg-slate-800/60 opacity-0 group-hover:opacity-100 transition-opacity"
        : "h-7 w-7 text-slate-300 hover:text-white hover:bg-slate-800/80 opacity-100 transition-opacity";
    const copyIconSize = densityMode === "compact" ? "w-3 h-3" : "w-4 h-4";

    useEffect(() => {
        results.forEach(item => {
            if (!item.capabilities?.isBlocked || !item.formulaId || !item.formulaVersion) return;
            const key = `${item.formulaId}:${item.formulaVersion}:${item.id}`;
            if (archivedNoticeRef.current.has(key)) return;
            archivedNoticeRef.current.add(key);
            toast.warning("Formula archived", {
                description: `${item.title} is disabled.`,
                id: `archived-${key}`
            });
        });
    }, [results]);

    const isWorkspaceEmpty = widgets.length === 0;

    // If we have widgets but no results (input < 2 digits), show placeholders
    const displayItems = results.length > 0 ? results : widgets.map(w => ({
        id: w.id,
        title: w.title,
        total: 0,
        data: []
    }));

    return (
        <div className={`grid grid-cols-1 md:grid-cols-2 ${panelGap}`}>
            {isWorkspaceEmpty && (
                <div className="col-span-full flex flex-col items-center justify-center h-full text-slate-500 space-y-4">
                    <p className="text-sm">Workspace is empty.</p>
                    <p className="text-xs">Use the Command Deck to add widgets.</p>
                </div>
            )}
            {displayItems.map((item) => (
                <Card
                    key={item.id}
                    className={`bg-slate-900 border-slate-800 text-slate-200 shadow-sm hover:border-slate-700 transition-colors group relative ${highlightedPanelId === item.id ? "ring-2 ring-emerald-400/60" : ""}`}
                    onClick={(event) => {
                        if (!(event.ctrlKey || event.metaKey)) return;
                        event.preventDefault();
                        event.stopPropagation();
                        const consentKey = item.formulaId && item.formulaVersion ? `${item.formulaId}:${item.formulaVersion}:${item.id}` : "";
                        const consentGranted = consentKey ? hasConsent(consentKey) : false;
                        if (item.capabilities?.requiresConsent && consentKey && !consentGranted) {
                            setPendingCopy({
                                panelId: item.id,
                                panelName: item.title,
                                data: item.data,
                                consentKey
                            });
                            return;
                        }
                        void handleCopy(item.id, item.title, item.data, consentKey, item.capabilities, consentGranted);
                    }}
                >
                    <CardHeader className={`${headerPadding} flex flex-row items-center justify-between space-y-0`}>
                        <CardTitle className="text-sm font-medium text-blue-400 uppercase tracking-wider">
                            {item.title}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                                {item.total} Matches
                            </span>
                            {item.capabilities?.message && (
                                <span
                                    className={`text-[10px] px-2 py-0.5 rounded-full ${item.capabilities.severity === "block"
                                            ? "bg-red-900/40 text-red-300"
                                            : item.capabilities.severity === "warn"
                                                ? "bg-amber-900/40 text-amber-300"
                                                : "bg-slate-800 text-slate-400"
                                        }`}
                                >
                                    {item.capabilities.message}
                                </span>
                            )}
                            <Button
                                variant="ghost"
                                size="icon"
                                className={copyButtonClasses}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    const consentKey = item.formulaId && item.formulaVersion ? `${item.formulaId}:${item.formulaVersion}:${item.id}` : "";
                                    const consentGranted = consentKey ? hasConsent(consentKey) : false;
                                    if (item.capabilities?.requiresConsent && consentKey && !consentGranted) {
                                        setPendingCopy({
                                            panelId: item.id,
                                            panelName: item.title,
                                            data: item.data,
                                            consentKey
                                        });
                                        return;
                                    }
                                    void handleCopy(item.id, item.title, item.data, consentKey, item.capabilities, consentGranted);
                                }}
                                title="Copy Result"
                            >
                                <Copy className={copyIconSize} />
                            </Button>
                            {/* Delete Button */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-slate-600 hover:text-red-400 hover:bg-red-950/20 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    removeWidget(item.id);
                                }}
                                title="Remove Widget"
                            >
                                <Trash2 className="w-3 h-3" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className={`bg-slate-950/50 rounded-md border border-slate-800/50 ${contentPadding} min-h-[100px] max-h-[200px] overflow-y-auto ${item.capabilities?.isBlocked ? "opacity-60" : ""}`}>
                            {item.capabilities?.isBlocked ? (
                                <p className="text-xs text-slate-500 italic text-center py-4">
                                    Archived — panel disabled.
                                </p>
                            ) : item.data.length > 0 ? (
                                <p className="font-mono text-sm leading-relaxed text-slate-300 break-all">
                                    {item.data.join(", ")}
                                </p>
                            ) : (
                                <p className="text-xs text-slate-600 italic text-center py-4">
                                    {results.length > 0 ? "No matches found." : "Waiting for input..."}
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ))}
            {pendingCopy && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-xl p-5">
                        <h3 className="text-sm font-semibold text-white mb-2">Deprecated Formula</h3>
                        <p className="text-xs text-slate-400 mb-4">
                            This formula is deprecated. Continue to enable copy for this panel?
                        </p>
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" className="text-slate-300" onClick={() => setPendingCopy(null)}>
                                Cancel
                            </Button>
                            <Button
                                className="bg-amber-500 text-slate-900 hover:bg-amber-400"
                                onClick={() => {
                                    grantConsent(pendingCopy.consentKey);
                                    void handleCopy(
                                        pendingCopy.panelId,
                                        pendingCopy.panelName,
                                        pendingCopy.data,
                                        pendingCopy.consentKey,
                                        {
                                            canCompute: true,
                                            canCopy: false,
                                            requiresConsent: true,
                                            isBlocked: false,
                                            severity: "info"
                                        },
                                        true
                                    );
                                    setPendingCopy(null);
                                }}
                            >
                                Acknowledge & Continue
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
