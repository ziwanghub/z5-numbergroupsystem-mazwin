
import { useEffect, useRef, useState } from "react";
import { CalculationResult } from "../../models/Calculation";
import { Button } from "../ui/button";
import { useCalculationContext } from "../../context/CalculationContext";
import { toast } from "sonner";
import { grantConsent, hasConsent } from "../../lib/formula-consent";
import ReportIssueModal from "../tickets/ReportIssueModal";
import ReviewModal from "../reviews/ReviewModal"; // [NEW]
import { ResultCard } from "./ResultCard"; // [NEW] Import extracted component

interface ResultGridProps {
    results: CalculationResult[];
    densityMode: "compact" | "comfort";
}

export function ResultGrid({ results, densityMode }: ResultGridProps) {
    const { removeWidget, widgets, isReady, setLastCopy, input } = useCalculationContext();
    const [highlightedPanelId, setHighlightedPanelId] = useState<string | null>(null);
    const [pendingCopy, setPendingCopy] = useState<{
        panelId: string;
        panelName: string;
        data: string[];
        consentKey: string;
        capabilities?: any; // Avoiding strict type for legacy compat
    } | null>(null);

    // Modal States
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [snapshotData, setSnapshotData] = useState<any>(null);

    // [NEW] Review State
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [reviewContext, setReviewContext] = useState<{ recipeId: string; recipeName: string } | null>(null);

    const highlightTimeoutRef = useRef<number | null>(null);
    const archivedNoticeRef = useRef<Set<string>>(new Set());

    // Report Handler
    const handleReport = (item: any) => {
        setSnapshotData({
            title: `Issue with: ${item.title}`, // Auto-fill title with recipe name
            inputs: { value: input }, // Current global input
            results: item.data, // This card's results
            formulaId: item.formulaId || 'unknown',
            formulaVersion: item.formulaVersion,
            timestamp: new Date().toISOString()
        });
        setReportModalOpen(true);
    };

    // [NEW] Review Handler
    const handleRate = (item: any) => {
        setReviewContext({
            recipeId: item.formulaId || item.id, // Fallback to ID if no formulaId
            recipeName: item.title
        });
        setReviewModalOpen(true);
    };

    // Centralized Copy Logic
    const performCopy = async (
        item: any,
        consentGranted: boolean = false
    ) => {
        const { id, title, data, formulaId, formulaVersion, capabilities } = item;
        const consentKey = formulaId && formulaVersion ? `${formulaId}:${formulaVersion}:${id}` : "";

        // Consent Check
        const effectiveConsent = consentGranted || (consentKey ? hasConsent(consentKey) : false);

        if (capabilities?.requiresConsent && consentKey && !effectiveConsent) {
            setPendingCopy({
                panelId: id,
                panelName: title,
                data: data,
                consentKey,
                capabilities
            });
            return;
        }

        const canCopy = capabilities?.canCopy || (capabilities?.requiresConsent && effectiveConsent) || !capabilities; // Default allow if active

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
                panelId: id,
                panelName: title,
                copiedAt: Date.now()
            });

            toast.success("✓ Copied", {
                description: title,
                id: "copy-feedback"
            });

            setHighlightedPanelId(id);
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

            {/* Render Cards using Extracted Component */}
            {displayItems.map((item: any) => (
                <ResultCard
                    key={item.id}
                    item={item}
                    densityMode={densityMode}
                    highlightedPanelId={highlightedPanelId}
                    isReady={isReady || results.length === 0} // Allow interaction even if waiting
                    onCopy={(item, consent) => performCopy(item, consent)}
                    onRemove={removeWidget}
                    onReport={handleReport}
                    onRate={handleRate} // [NEW]
                />
            ))}

            {/* Consent Modal */}
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
                                    // Retry copy with explicit consent
                                    performCopy({
                                        id: pendingCopy.panelId,
                                        title: pendingCopy.panelName,
                                        data: pendingCopy.data,
                                        formulaId: pendingCopy.consentKey.split(':')[0],
                                        formulaVersion: pendingCopy.consentKey.split(':')[1],
                                        capabilities: pendingCopy.capabilities
                                    }, true);
                                    setPendingCopy(null);
                                }}
                            >
                                Acknowledge & Continue
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Report Modal */}
            <ReportIssueModal
                isOpen={reportModalOpen}
                onClose={() => setReportModalOpen(false)}
                snapshot={snapshotData}
            />

            {/* [NEW] Review Modal */}
            <ReviewModal
                isOpen={reviewModalOpen}
                onClose={() => setReviewModalOpen(false)}
                context={reviewContext}
            />
        </div>
    );
}
