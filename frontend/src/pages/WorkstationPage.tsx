import { ResultGrid } from "../components/workstation/ResultGrid";
import { CommandDeck } from "../components/workstation/CommandDeck";
import { useCalculationContext } from "../context/CalculationContext";

export default function WorkstationPage() {
    const { results } = useCalculationContext();

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-full">
            {/* MAIN WORK AREA (Left/Center) */}
            <div className="flex-1 flex flex-col gap-6 min-w-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight mb-1">{">"} Number Grouping</h2>
                        <p className="text-slate-400 text-sm">Real-time Calculation Engine</p>
                    </div>
                    <div className="text-xs text-slate-600 font-mono">
                        STATUS: ONLINE
                    </div>
                </div>

                {/* RESULT GRID (Directly wired to Context) */}
                <section className="flex-1 min-h-0 overflow-y-auto pr-1">
                    <ResultGrid results={results} />
                </section>
            </div>

            {/* COMMAND DECK (Right Sidebar) */}
            <aside className="w-full lg:w-72 shrink-0 border-l border-slate-800/50 pl-0 lg:pl-6 pt-6 lg:pt-0">
                <CommandDeck />
            </aside>
        </div>
    );
}
