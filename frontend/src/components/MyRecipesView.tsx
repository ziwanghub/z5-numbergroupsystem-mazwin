import React, { useEffect, useState } from 'react';
import {
    Search,
    Heart,
    Trash2,
    Play,
    Edit2,
    Ghost,
    RefreshCw,
    Power,
    Ban,
    Loader2
} from 'lucide-react';
import { toast } from "sonner";
import { recipeService, Recipe } from '../services/recipeService';
import { useCalculationContext } from '../context/CalculationContext';
import { Input } from './ui/input';
import { EditRecipeModal } from './recipes/EditRecipeModal';

export const MyRecipesView = () => {
    const { addWidget } = useCalculationContext();
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Edit Modal State
    const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // View Mode State
    const [showTrash, setShowTrash] = useState(false);

    // --- Data Fetching ---
    const fetchRecipes = async () => {
        try {
            setLoading(true);
            // Fetch Active or Trash based on toggle
            const data = showTrash
                ? await recipeService.getTrash()
                : await recipeService.getRecipes();
            setRecipes(data);
        } catch (err) {
            console.error("Failed to fetch recipes", err);
            toast.error("Failed to load recipes.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecipes();
    }, [showTrash]);

    // --- Actions ---

    // 1. Load to Workstation
    const handleLoad = (recipe: Recipe) => {
        if (!recipe.isActive) {
            toast.error("Cannot load inactive recipe.");
            return;
        }
        try {
            addWidget({
                title: recipe.name,
                formulaId: recipe.baseFormulaId,
                formulaVersion: "1.0.0",
                params: recipe.config
            });
            toast.success(`Loaded "${recipe.name}" to Workstation`);
        } catch (e) {
            console.error("Failed to load recipe", e);
            toast.error("Failed to add widget to workstation.");
        }
    };

    // 2. Delete (Soft)
    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Move "${name}" to trash?`)) return;
        try {
            await recipeService.deleteRecipe(id);
            toast.success("Moved to Trash");
            setRecipes(prev => prev.filter(r => r._id !== id));
        } catch (err) {
            toast.error("Failed to delete recipe");
        }
    };

    // 3. Toggle Favorite
    const handleToggleFavorite = async (id: string, current: boolean) => {
        try {
            setRecipes(prev => prev.map(r => r._id === id ? { ...r, isFavorite: !current } : r));
            await recipeService.toggleFavorite(id, current);
        } catch (err) {
            setRecipes(prev => prev.map(r => r._id === id ? { ...r, isFavorite: current } : r));
            toast.error("Failed to update favorite");
        }
    };

    // 4. Edit (Modal)
    const handleEditClick = (recipe: Recipe) => {
        setEditingRecipe(recipe);
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = async (id: string, updates: { name: string, config: any }) => {
        try {
            // Optimistic UI Update
            setRecipes(prev => prev.map(r => r._id === id ? { ...r, ...updates } : r));

            await recipeService.updateRecipe(id, updates);
            toast.success("Recipe updated successfully");
        } catch (err) {
            toast.error("Failed to update recipe");
            fetchRecipes(); // Revert
        }
    };

    // 5. Toggle Active
    const handleToggleActive = async (id: string, current: boolean) => {
        try {
            setRecipes(prev => prev.map(r => r._id === id ? { ...r, isActive: !current } : r));
            await recipeService.toggleActive(id, current);
            toast.success(current ? "Recipe Deactivated" : "Recipe Activated");
        } catch (err) {
            setRecipes(prev => prev.map(r => r._id === id ? { ...r, isActive: current } : r));
            toast.error("Failed to toggle status");
        }
    };

    // 6. Restore
    const handleRestore = async (id: string) => {
        try {
            await recipeService.restoreRecipe(id);
            toast.success("Recipe Restored");
            setRecipes(prev => prev.filter(r => r._id !== id));
        } catch (err) {
            toast.error("Failed to restore recipe");
        }
    };

    // 7. Hard Delete
    const handleHardDelete = async (id: string) => {
        if (!confirm("PERMANENTLY DELETE? This cannot be undone.")) return;
        try {
            await recipeService.hardDeleteRecipe(id);
            toast.success("Recipe Permanently Deleted");
            setRecipes(prev => prev.filter(r => r._id !== id));
        } catch (err) {
            toast.error("Failed to delete recipe");
        }
    };

    // --- Filter & Sort ---
    const filteredRecipes = recipes
        .filter(r =>
            r.name.toLowerCase().includes(search.toLowerCase()) ||
            r.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()))
        )
        .sort((a, b) => {
            if (!showTrash) {
                if (a.isFavorite === b.isFavorite) {
                    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
                }
                return (a.isFavorite ? -1 : 1);
            }
            return 0;
        });

    return (
        <div className="flex flex-col h-full gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight mb-1 flex items-center gap-2">
                        {showTrash ? (
                            <>
                                <Ghost className="w-6 h-6 text-purple-400" />
                                <span className="text-purple-200">Trash Bin</span>
                            </>
                        ) : (
                            "My Recipes"
                        )}
                    </h2>
                    <p className="text-slate-400 text-sm">
                        {showTrash ? "Restore or permanently delete items." : "Manage your saved custom formulas."}
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {/* View Toggle */}
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-1 flex items-center">
                        <button
                            onClick={() => setShowTrash(false)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${!showTrash ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
                        >
                            Library
                        </button>
                        <button
                            onClick={() => setShowTrash(true)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${showTrash ? "bg-purple-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
                        >
                            Trash
                        </button>
                    </div>

                    <div className="relative w-64">
                        <Search className="w-4 h-4 text-slate-500 absolute top-1/2 -translate-y-1/2 left-3" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={showTrash ? "Search trash..." : "Search recipes..."}
                            className="pl-9 bg-slate-900/50 border-slate-700"
                        />
                    </div>
                </div>
            </div>

            <div className={`flex-1 overflow-y-auto ${showTrash ? "bg-purple-900/10 border-purple-900/20" : "bg-slate-900/20 border-slate-800/50"} border rounded-xl p-4`}>
                {loading ? (
                    <div className="flex items-center justify-center h-40">
                        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                    </div>
                ) : filteredRecipes.length === 0 ? (
                    <div className="text-center py-10 text-slate-500">
                        {showTrash ? (
                            <p>Trash is empty.</p>
                        ) : (
                            <>
                                <p>No recipes found.</p>
                                <p className="text-xs mt-2">Create one in the "System Registry" (Recipe Studio)!</p>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredRecipes.map(recipe => (
                            <div
                                key={recipe._id}
                                className={`group relative border rounded-xl p-4 transition-all flex flex-col justify-between ${showTrash
                                        ? "bg-slate-950/50 border-slate-800 opacity-80 hover:opacity-100"
                                        : recipe.isActive === false
                                            ? "bg-slate-900/40 border-slate-800"
                                            : "bg-slate-900/80 border-slate-800 hover:border-slate-600 hover:shadow-lg hover:shadow-blue-900/10"
                                    }`}
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1 min-w-0 pr-2">
                                        <div className="flex items-center gap-2">
                                            {!showTrash && (
                                                <div
                                                    className={`w-2 h-2 rounded-full ${recipe.isActive !== false ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-slate-600"}`}
                                                    title={recipe.isActive !== false ? "Active" : "Inactive"}
                                                />
                                            )}
                                            <h3 className={`font-semibold truncate transition-colors ${recipe.isActive !== false ? "text-slate-200 group-hover:text-white" : "text-slate-500"}`}>
                                                {recipe.name}
                                            </h3>
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate pl-4">
                                            {recipe.baseFormulaId}
                                        </p>
                                    </div>

                                    {!showTrash && (
                                        <button
                                            onClick={() => handleToggleFavorite(recipe._id, !!recipe.isFavorite)}
                                            className={`p-1.5 rounded-full transition-colors ${recipe.isFavorite ? "text-pink-500 bg-pink-500/10" : "text-slate-600 hover:text-pink-500 hover:bg-slate-800"}`}
                                        >
                                            <Heart className={`w-3.5 h-3.5 ${recipe.isFavorite ? "fill-pink-500" : ""}`} />
                                        </button>
                                    )}
                                </div>

                                {/* Config / Tags Preview */}
                                <div className="flex-1 mb-4 pl-4">
                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                        {recipe.tags?.map(tag => (
                                            <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-slate-800 rounded text-slate-400 border border-slate-700/50">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                    <p className="text-xs text-slate-400 line-clamp-2 min-h-[2.5em]">
                                        {recipe.description || "No description provided."}
                                    </p>
                                </div>

                                {/* Actions Footer */}
                                <div className="flex items-center gap-2 pt-3 border-t border-slate-800/50">
                                    {showTrash ? (
                                        // TRASH ACTIONS
                                        <>
                                            <button
                                                onClick={() => handleRestore(recipe._id)}
                                                className="flex-1 flex items-center justify-center gap-2 bg-emerald-600/10 hover:bg-emerald-600 hover:text-white text-emerald-400 border border-emerald-600/20 hover:border-emerald-600 text-xs font-semibold py-1.5 rounded-md transition-all"
                                            >
                                                <RefreshCw className="w-3 h-3" />
                                                Restore
                                            </button>
                                            <button
                                                onClick={() => handleHardDelete(recipe._id)}
                                                className="p-1.5 text-slate-500 hover:text-red-400 rounded-md hover:bg-red-900/20"
                                                title="Permanently Delete"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </>
                                    ) : (
                                        // ACTIVE ACTIONS
                                        <>
                                            {recipe.isActive !== false ? (
                                                <button
                                                    onClick={() => handleLoad(recipe)}
                                                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600/10 hover:bg-blue-600 hover:text-white text-blue-400 border border-blue-600/20 hover:border-blue-600 text-xs font-semibold py-1.5 rounded-md transition-all"
                                                >
                                                    <Play className="w-3 h-3" />
                                                    Load
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleLoad(recipe)}
                                                    disabled
                                                    className="flex-1 flex items-center justify-center gap-2 bg-slate-800 text-slate-500 border border-slate-700 text-xs font-semibold py-1.5 rounded-md cursor-not-allowed"
                                                >
                                                    <Ban className="w-3 h-3" />
                                                    Inactive
                                                </button>
                                            )}

                                            <div className="flex items-center border-l border-slate-800 pl-2 gap-1">
                                                {/* Circuit Breaker Toggle */}
                                                <button
                                                    onClick={() => handleToggleActive(recipe._id, !!recipe.isActive)}
                                                    className={`p-1.5 rounded-md transition-colors ${recipe.isActive !== false ? "text-emerald-500 hover:bg-emerald-900/20" : "text-slate-500 hover:text-emerald-400"}`}
                                                    title={recipe.isActive !== false ? "Deactivate" : "Activate"}
                                                >
                                                    <Power className="w-3.5 h-3.5" />
                                                </button>

                                                <button
                                                    onClick={() => handleEditClick(recipe)}
                                                    className="p-1.5 text-slate-500 hover:text-blue-400 rounded-md hover:bg-slate-800"
                                                    title="Edit Configuration"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(recipe._id, recipe.name)}
                                                    className="p-1.5 text-slate-500 hover:text-red-400 rounded-md hover:bg-slate-800"
                                                    title="Move to Trash"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>

                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* MODAL */}
            <EditRecipeModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                recipe={editingRecipe}
                onSave={handleSaveEdit}
            />
        </div>
    );
};
