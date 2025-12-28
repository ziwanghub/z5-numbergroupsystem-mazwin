import { Plus, LayoutGrid, RotateCcw, FlaskConical, Trash2 } from "lucide-react";
import { useCalculationContext } from "../../context/CalculationContext";
import { Button } from "../ui/button";
import { getLatestFormula } from "../../lib/formula-registry";
import { useEffect, useState } from "react";
import { recipeService } from "../../services/recipeService";

interface Recipe {
    _id: string;
    name: string;
    description: string;
    baseFormulaId: string;
    config: any;
    uiOptions?: {
        color: string;
        icon: string;
    };
}

export function CommandDeck() {
    const { addWidget, resetLayout } = useCalculationContext();
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRecipes = async () => {
        try {
            setLoading(true);
            const data = await recipeService.getRecipes();
            setRecipes(data);
        } catch (err) {
            console.error("Failed to load recipes", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecipes();
        // Poll for updates every 5 seconds to keep sidebar fresh if user adds new recipe in library
        const interval = setInterval(fetchRecipes, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleAddWidget = (recipe: Recipe) => {
        addWidget({
            title: recipe.name,
            formulaId: recipe.baseFormulaId,
            formulaVersion: getLatestFormula(recipe.baseFormulaId)?.version || '1.0.0',
            params: recipe.config
        });
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (window.confirm("Delete this recipe?")) {
            await recipeService.deleteRecipe(id);
            fetchRecipes();
        }
    };

    return (
        <div className="h-full flex flex-col gap-6 p-1">
            {/* WIDGET CONTROLS */}
            <div className="space-y-4 flex-1 flex flex-col min-h-0">
                <h3 className="flex items-center text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0">
                    <LayoutGrid className="w-4 h-4 mr-2" /> Recipe Deck
                </h3>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
                    {loading && recipes.length === 0 ? (
                        <div className="text-xs text-slate-600 italic p-2">Loading recipes...</div>
                    ) : recipes.length === 0 ? (
                        <div className="p-4 border border-dashed border-slate-800 rounded-lg text-center">
                            <p className="text-xs text-slate-500 mb-2">No recipes found.</p>
                            <p className="text-[10px] text-slate-600">Go to Formula Library and save your favorite setup!</p>
                        </div>
                    ) : (
                        recipes.map((recipe) => (
                            <div
                                key={recipe._id}
                                onClick={() => handleAddWidget(recipe)}
                                className="group relative flex flex-col gap-1 p-3 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-800 hover:border-slate-700 cursor-pointer transition-all active:scale-[0.98]"
                            >
                                <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg bg-${recipe.uiOptions?.color || 'blue'}-500/50 group-hover:bg-${recipe.uiOptions?.color || 'blue'}-400 transition-colors`}></div>

                                <div className="flex items-start justify-between pl-2">
                                    <div className="font-medium text-sm text-slate-200 group-hover:text-white">
                                        {recipe.name}
                                    </div>
                                    {/* Badges */}
                                    <div className="flex gap-1">
                                        <span className="text-[10px] bg-slate-950 px-1.5 py-0.5 rounded text-slate-500 border border-slate-800">
                                            {recipe.config.length}D
                                        </span>
                                    </div>
                                </div>

                                <div className="pl-2 text-[10px] text-slate-500 line-clamp-2 leading-tight">
                                    {recipe.description}
                                </div>

                                <button
                                    onClick={(e) => handleDelete(e, recipe._id)}
                                    className="absolute right-2 bottom-2 text-slate-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                    title="Delete Recipe"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="border-t border-slate-800 my-2 shrink-0"></div>

            {/* WORKSPACE TOOLS */}
            <div className="space-y-4 shrink-0">
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
