import { ArrowRight, Terminal, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

interface InputZoneProps {
    value: string;
    onChange: (val: string) => void;
    onPredict: () => void;
    isProcessing: boolean;
}

export function InputZone({ value, onChange, onPredict, isProcessing }: InputZoneProps) {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !isProcessing) {
            onPredict();
        }
    };

    return (
        <div className="space-y-4">
            <div className="relative">
                <div className="absolute top-3 left-3 text-slate-500">
                    <Terminal className="w-5 h-5" />
                </div>
                <Input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isProcessing}
                    className="h-16 pl-12 pr-4 text-lg font-mono bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-blue-500 focus-visible:border-blue-500 rounded-xl shadow-inner disabled:opacity-50"
                    placeholder="Enter digits (e.g. 12345)..."
                />
                <div className="absolute top-3 right-3">
                    <Button
                        size="sm"
                        onClick={onPredict}
                        disabled={isProcessing}
                        className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 disabled:bg-slate-700"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Computing...
                            </>
                        ) : (
                            <>
                                Predict <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <div className="flex items-center justify-between px-2 text-xs text-slate-500">
                <div className="flex gap-4">
                    <span>INPUT_MODE: RAW</span>
                    <span>TOKEN: ACTIVE</span>
                </div>
                <div>
                    Press <span className="text-slate-400 font-bold">Enter</span> to execute
                </div>
            </div>
        </div>
    );
}
