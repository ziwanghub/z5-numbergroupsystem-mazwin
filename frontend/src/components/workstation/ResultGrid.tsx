import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { CalculationResult } from "../../models/Calculation";

interface ResultGridProps {
    results: CalculationResult[];
}

export function ResultGrid({ results }: ResultGridProps) {
    if (results.length === 0) {
        // Render Empty State Placeholders
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="bg-slate-900 border-slate-800 text-slate-200 shadow-sm transition-colors opacity-60">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                                Result Panel {i}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-24 flex items-center justify-center text-slate-600 font-mono text-sm bg-slate-950/30 rounded-md border border-slate-800/50">
                                Ready to calculate...
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((result) => (
                <Card key={result.id} className="bg-slate-900 border-slate-800 text-slate-200 shadow-sm hover:border-slate-700 transition-colors">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm font-medium text-blue-400 uppercase tracking-wider">
                            {result.title}
                        </CardTitle>
                        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                            {result.stats.count} Matches
                        </span>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-slate-950/50 rounded-md border border-slate-800/50 p-4 min-h-[100px] max-h-[200px] overflow-y-auto">
                            {result.data.length > 0 ? (
                                <p className="font-mono text-sm leading-relaxed text-slate-300 break-all">
                                    {result.data.join(", ")}
                                </p>
                            ) : (
                                <p className="text-xs text-slate-600 italic text-center py-4">
                                    No matches found based on current criteria.
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
