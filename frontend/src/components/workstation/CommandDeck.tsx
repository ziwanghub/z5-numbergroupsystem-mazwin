import { Activity, BookOpen, Layers } from "lucide-react";

export function CommandDeck() {
    return (
        <div className="h-full flex flex-col gap-6 p-1">
            {/* RULES SECTION */}
            <div className="space-y-3">
                <h3 className="flex items-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <BookOpen className="w-4 h-4 mr-2" /> Active Rules
                </h3>
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between text-sm text-slate-300">
                        <span>Standard Grouping</span>
                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                    </div>
                    <div className="text-xs text-slate-500">Formula v1.2.0 loaded</div>
                </div>
            </div>

            {/* STATS SECTION */}
            <div className="space-y-3">
                <h3 className="flex items-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <Activity className="w-4 h-4 mr-2" /> Session Stats
                </h3>
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 space-y-3">
                    <div>
                        <div className="text-xs text-slate-500 uppercase">Calculations</div>
                        <div className="text-xl font-mono text-white">0</div>
                    </div>
                    <div>
                        <div className="text-xs text-slate-500 uppercase">Success Rate</div>
                        <div className="text-xl font-mono text-white">100%</div>
                    </div>
                </div>
            </div>

            {/* LAYERS SECTION */}
            <div className="space-y-3">
                <h3 className="flex items-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <Layers className="w-4 h-4 mr-2" /> Config
                </h3>
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 text-xs text-slate-500">
                    Preset: Default
                </div>
            </div>
        </div>
    );
}
