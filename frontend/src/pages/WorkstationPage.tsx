import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { ResultGrid } from "../components/workstation/ResultGrid";
import { CommandDeck } from "../components/workstation/CommandDeck";
import { useCalculationContext } from "../context/CalculationContext";

type LayoutContext = { densityMode: "compact" | "comfort" };

export default function WorkstationPage() {
    const { results } = useCalculationContext();
    const { densityMode } = useOutletContext<LayoutContext>();
    const [isRightCollapsed, setIsRightCollapsed] = useState(false);

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-full">
            {/* MAIN WORK AREA (Left/Center) */}
            <div className="flex-1 flex flex-col gap-6 min-w-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight mb-1">{">"} Number Grouping</h2>
                        <p className="text-slate-400 text-sm">Real-time Calculation Engine</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-xs text-slate-600 font-mono">
                            STATUS: ONLINE
                        </div>
                        <button
                            type="button"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                            onClick={() => setIsRightCollapsed(prev => !prev)}
                            title={isRightCollapsed ? "Expand Panel" : "Collapse Panel"}
                        >
                            {isRightCollapsed ? <PanelRightOpen className="w-4 h-4" /> : <PanelRightClose className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* RESULT GRID (Directly wired to Context) */}
                <section className="flex-1 min-h-0 overflow-y-auto pr-1">
                    <ResultGrid results={results} densityMode={densityMode} />
                </section>
            </div>

            {/* COMMAND DECK (Right Sidebar) */}
            {!isRightCollapsed && (
                <aside className="w-full lg:w-72 shrink-0 border-l border-slate-800/50 pl-0 lg:pl-6 pt-6 lg:pt-0">
                    <CommandDeck />
                </aside>
            )}
        </div>
    );
}
