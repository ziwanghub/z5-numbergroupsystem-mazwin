import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export function ResultGrid() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="bg-slate-900 border-slate-800 text-slate-200 shadow-sm hover:border-slate-700 transition-colors">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                            Result Panel {i}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-24 flex items-center justify-center text-slate-600 font-mono text-sm bg-slate-950/30 rounded-md border border-slate-800/50">
                            Awaiting Calculation...
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
