import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Copy, Trash2, TriangleAlert, Star } from "lucide-react";
import { CalculationResult } from "../../models/Calculation";
import { hasConsent } from "../../lib/formula-consent";

interface ResultCardProps {
    item: CalculationResult; // Should implicitly match the shape we need
    densityMode: "compact" | "comfort";
    highlightedPanelId: string | null;
    isReady: boolean;
    onCopy: (item: any, consentGranted?: boolean) => void;
    onRemove: (id: string) => void;
    onReport: (item: any) => void;
    onRate: (item: any) => void;
}

export function ResultCard({
    item,
    densityMode,
    highlightedPanelId,
    isReady,
    onCopy,
    onRemove,
    onReport,
    onRate
}: ResultCardProps) {

    // Style Helpers
    const headerPadding = densityMode === "compact" ? "pb-1" : "pb-3";
    const contentPadding = densityMode === "compact" ? "p-3" : "p-5";
    const copyButtonClasses = densityMode === "compact"
        ? "h-5 w-5 text-slate-500 hover:text-slate-200 hover:bg-slate-800/60 opacity-0 group-hover:opacity-100 transition-opacity"
        : "h-7 w-7 text-slate-300 hover:text-white hover:bg-slate-800/80 opacity-100 transition-opacity";
    const copyIconSize = densityMode === "compact" ? "w-3 h-3" : "w-4 h-4";

    // Handle Card Click (Copy Shortcut)
    const handleCardClick = (event: React.MouseEvent) => {
        if (!(event.ctrlKey || event.metaKey)) return;
        event.preventDefault();
        event.stopPropagation();
        const consentKey = item.formulaId && item.formulaVersion ? `${item.formulaId}:${item.formulaVersion}:${item.id}` : "";
        const consentGranted = consentKey ? hasConsent(consentKey) : false;
        onCopy(item, consentGranted);
    };

    return (
        <Card
            className={`bg-slate-900 border-slate-800 text-slate-200 shadow-sm hover:border-slate-700 transition-colors group relative ${highlightedPanelId === item.id ? "ring-2 ring-emerald-400/60" : ""}`}
            onClick={handleCardClick}
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

                    {/* Report Issue Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                            e.stopPropagation();
                            onReport(item);
                        }}
                        title="Report Issue"
                    >
                        <TriangleAlert className="w-3.5 h-3.5" />
                    </Button>

                    {/* [NEW] Rate Recipe Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-slate-500 hover:text-amber-400 hover:bg-amber-950/20 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                            e.stopPropagation();
                            onRate(item);
                        }}
                        title="Rate Recipe"
                    >
                        <Star className="w-3.5 h-3.5" />
                    </Button>

                    {/* Copy Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className={copyButtonClasses}
                        onClick={(event) => {
                            event.stopPropagation();
                            const consentKey = item.formulaId && item.formulaVersion ? `${item.formulaId}:${item.formulaVersion}:${item.id}` : "";
                            const consentGranted = consentKey ? hasConsent(consentKey) : false;
                            onCopy(item, consentGranted);
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
                            onRemove(item.id);
                        }}
                        title="Remove Widget"
                    >
                        <Trash2 className="w-3 h-3" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className={`bg-slate-900/50 rounded-md border border-slate-800/50 ${contentPadding} min-h-[100px] max-h-[200px] overflow-y-auto ${item.capabilities?.isBlocked ? "opacity-60" : ""}`}>
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
                            {isReady ? "No matches found." : "Waiting for input..."}
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
