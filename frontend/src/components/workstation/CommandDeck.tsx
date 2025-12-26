import { Plus, LayoutGrid, RotateCcw } from "lucide-react";
import { useCalculationContext } from "../../context/CalculationContext";
import { Button } from "../ui/button";
import { getLatestFormula } from "../../lib/formula-registry";

export function CommandDeck() {
    const { addWidget, resetLayout } = useCalculationContext();

    return (
        <div className="h-full flex flex-col gap-6 p-1">
            {/* WIDGET CONTROLS */}
            <div className="space-y-4">
                <h3 className="flex items-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <LayoutGrid className="w-4 h-4 mr-2" /> Add Widget
                </h3>

                <div className="grid grid-cols-1 gap-2">
                    <Button
                        variant="outline"
                        className="justify-start bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-300"
                        onClick={() => addWidget({
                            title: '2 Digits (Combination)',
                            formulaId: 'digits-group',
                            formulaVersion: getLatestFormula('digits-group')?.version || '1.0.0',
                            params: { size: 2, mode: 'C', allowDouble: false }
                        })}
                    >
                        <Plus className="w-4 h-4 mr-2 text-blue-400" />
                        2 Digits (Comb)
                    </Button>

                    <Button
                        variant="outline"
                        className="justify-start bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-300"
                        onClick={() => addWidget({
                            title: '3 Digits (Combination)',
                            formulaId: 'digits-group',
                            formulaVersion: getLatestFormula('digits-group')?.version || '1.0.0',
                            params: { size: 3, mode: 'C', allowDouble: false }
                        })}
                    >
                        <Plus className="w-4 h-4 mr-2 text-green-400" />
                        3 Digits (Comb)
                    </Button>

                    <Button
                        variant="outline"
                        className="justify-start bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-300"
                        onClick={() => addWidget({
                            title: '2 Digits (Permutation)',
                            formulaId: 'digits-group',
                            formulaVersion: getLatestFormula('digits-group')?.version || '1.0.0',
                            params: { size: 2, mode: 'P', allowDouble: false }
                        })}
                    >
                        <Plus className="w-4 h-4 mr-2 text-purple-400" />
                        2 Digits (Perm)
                    </Button>
                </div>
            </div>

            <div className="border-t border-slate-800 my-2"></div>

            {/* WORKSPACE TOOLS */}
            <div className="space-y-4">
                <h3 className="flex items-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Workspace Actions
                </h3>

                <Button
                    variant="ghost"
                    className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-950/20"
                    onClick={resetLayout}
                >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset to Default
                </Button>
            </div>
        </div>
    );
}
