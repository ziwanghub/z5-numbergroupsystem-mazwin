import { InputZone } from "../components/workstation/InputZone";
import { ResultGrid } from "../components/workstation/ResultGrid";
import { CommandDeck } from "../components/workstation/CommandDeck";

export default function WorkstationPage() {
    return (
        <div className="flex flex-col lg:flex-row gap-6 h-full">
            {/* MAIN WORK AREA (Left/Center) */}
            <div className="flex-1 flex flex-col gap-6 min-w-0">
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight mb-1">{">"} Number Grouping</h2>
                    <p className="text-slate-400 text-sm">Main Calculation Engine</p>
                </div>

                {/* INPUT ZONE */}
                <section>
                    <InputZone />
                </section>

                {/* RESULT GRID */}
                <section className="flex-1 min-h-0 overflow-y-auto pr-1">
                    <ResultGrid />
                </section>
            </div>

            {/* COMMAND DECK (Right Sidebar) */}
            <aside className="w-full lg:w-72 shrink-0 border-l border-slate-800/50 pl-0 lg:pl-6 pt-6 lg:pt-0">
                <CommandDeck />
            </aside>
        </div>
    );
}
