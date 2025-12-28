import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useState, useEffect } from "react";
import { recipeService } from "../../services/recipeService";

interface SaveRecipeModalProps {
    isOpen: boolean;
    onClose: () => void;
    config: any;
    baseFormulaId: string;
    resultCount?: number;
    defaultDescription?: string;
}

export function SaveRecipeModal({
    isOpen,
    onClose,
    config,
    baseFormulaId,
    resultCount = 0,
    defaultDescription
}: SaveRecipeModalProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Auto-generate description when modal opens
    useEffect(() => {
        if (isOpen) {
            // Use provided defaultDescription if available, otherwise fallback to simple auto-gen
            if (defaultDescription) {
                setDescription(defaultDescription);
            } else {
                const len = config.length || 2;
                const mode = config.sortUnique ? "Set (C)" : "Sort (P)";
                const dbl = config.allowDoubles !== false ? "Double" : "NoDouble";
                setDescription(`Custom Formula: ${len} Digits, ${mode}, ${dbl} Logic. Output ~${resultCount} items.`);
            }
            const len = config.length || 2;
            setName(`My ${len}D Formula`); // Default name
            setError(null);
        }
    }, [isOpen, config, resultCount, defaultDescription]);

    const handleSave = async () => {
        if (!name.trim()) {
            setError("Name is required");
            return;
        }

        try {
            setLoading(true);
            await recipeService.createRecipe({
                name,
                description,
                baseFormulaId,
                config,
                uiOptions: {
                    color: "emerald", // Default for user recipes
                    icon: "flask-conical"
                }
            });
            onClose(); // Close on success
            // In a real app, we'd trigger a refresh or toast here
        } catch (err: any) {
            console.error(err);
            setError("Failed to save recipe. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-slate-950 border-slate-800 text-slate-100 max-w-sm">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold text-emerald-400 flex items-center gap-2">
                        ✨ Save As Recipe
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-400">Recipe Name</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. My Lucky 3D"
                            className="bg-slate-900 border-slate-700 focus:border-emerald-500/50"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-400">Description (Auto-generated)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full text-xs bg-slate-900 border border-slate-700 rounded-md p-2 text-slate-300 focus:outline-none focus:border-emerald-500/50 resize-none font-mono leading-relaxed"
                        />
                    </div>

                    {/* Preview Badge */}
                    <div className="flex flex-wrap gap-2 pt-2">
                        <span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400 border border-slate-700">
                            {config.length || 2} Digits
                        </span>
                        <span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400 border border-slate-700">
                            {config.sortUnique ? "Unique Set" : "Raw Perms"}
                        </span>
                    </div>

                    {error && (
                        <p className="text-xs text-red-400 bg-red-950/20 p-2 rounded border border-red-900/30">
                            {error}
                        </p>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
                    >
                        {loading ? "Saving..." : "Save Recipe"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
