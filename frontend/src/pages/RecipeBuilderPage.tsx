import { useState, useEffect } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown, Save, FileText, Settings, Play } from "lucide-react";
import { UserRecipe, RecipeStep } from "../models/Recipe";
import { RecipeManager } from "../lib/recipe-manager";
import { listComputeTemplates, getComputeTemplate, ComputeTemplate } from "../lib/formula-registry";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";

export default function RecipeBuilderPage() {
    const [recipes, setRecipes] = useState<UserRecipe[]>([]);
    const [activeRecipe, setActiveRecipe] = useState<UserRecipe | null>(null);
    const [isDirty, setIsDirty] = useState(false);
    const [availableTemplates, setAvailableTemplates] = useState<ComputeTemplate[]>([]);

    useEffect(() => {
        loadRecipes();
        setAvailableTemplates(listComputeTemplates());
    }, []);

    const loadRecipes = () => {
        setRecipes(RecipeManager.listRecipes());
    };

    const handleNewRecipe = () => {
        const newRecipe = RecipeManager.saveRecipe({
            name: "New Recipe",
            description: "",
            steps: []
        });
        loadRecipes();
        setActiveRecipe(newRecipe);
        setIsDirty(false);
    };

    const handleSelectRecipe = (recipe: UserRecipe) => {
        if (isDirty) {
            if (!confirm("You have unsaved changes. Discard them?")) return;
        }
        setActiveRecipe(JSON.parse(JSON.stringify(recipe))); // Deep clone to avoid mutating listing state
        setIsDirty(false);
    };

    const handleSave = () => {
        if (!activeRecipe) return;
        RecipeManager.saveRecipe(activeRecipe);
        loadRecipes();
        setIsDirty(false);
        // Optional: Toast success
    };

    const handleDelete = () => {
        if (!activeRecipe) return;
        if (!confirm(`Delete recipe "${activeRecipe.name}"?`)) return;
        RecipeManager.deleteRecipe(activeRecipe.id);
        loadRecipes();
        setActiveRecipe(null);
        setIsDirty(false);
    };

    const updateMetadata = (key: keyof UserRecipe, value: string) => {
        if (!activeRecipe) return;
        setActiveRecipe({ ...activeRecipe, [key]: value });
        setIsDirty(true);
    };

    // --- Steps Management ---

    const addStep = (templateKey: string) => {
        if (!activeRecipe) return;
        const template = getComputeTemplate(templateKey);
        if (!template) return;

        // Init default params
        const initialParams: Record<string, any> = {};
        if (template.paramsSpec) {
            Object.entries(template.paramsSpec).forEach(([k, spec]) => {
                initialParams[k] = spec.defaultValue ?? (spec.type === "boolean" ? false : "");
            });
        }

        const newStep: RecipeStep = {
            id: crypto.randomUUID(),
            moduleKey: templateKey,
            params: initialParams,
            isDisabled: false
        };

        setActiveRecipe({
            ...activeRecipe,
            steps: [...activeRecipe.steps, newStep]
        });
        setIsDirty(true);
    };

    const removeStep = (index: number) => {
        if (!activeRecipe) return;
        const newSteps = [...activeRecipe.steps];
        newSteps.splice(index, 1);
        setActiveRecipe({ ...activeRecipe, steps: newSteps });
        setIsDirty(true);
    };

    const moveStep = (index: number, direction: -1 | 1) => {
        if (!activeRecipe) return;
        const newSteps = [...activeRecipe.steps];
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= newSteps.length) return;

        [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
        setActiveRecipe({ ...activeRecipe, steps: newSteps });
        setIsDirty(true);
    };

    const updateStepParam = (stepIndex: number, paramKey: string, value: any) => {
        if (!activeRecipe) return;
        const newSteps = [...activeRecipe.steps];
        const step = { ...newSteps[stepIndex] };
        step.params = { ...step.params, [paramKey]: value };
        newSteps[stepIndex] = step;
        setActiveRecipe({ ...activeRecipe, steps: newSteps });
        setIsDirty(true);
    };

    // --- Render Helpers ---

    const renderParamInput = (stepIndex: number, key: string, spec: any, value: any) => {
        if (spec.type === "boolean") {
            return (
                <div className="flex items-center gap-2">
                    <Switch
                        checked={!!value}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateStepParam(stepIndex, key, e.target.checked)}
                    />
                    <span className="text-xs text-slate-400">{value ? "True" : "False"}</span>
                </div>
            );
        }

        if (spec.type && spec.type.includes("|")) {
            return (
                <select
                    className="bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-200"
                    value={String(value)}
                    onChange={(e) => updateStepParam(stepIndex, key, e.target.value)}
                >
                    {spec.type.split("|").map((opt: string) => {
                        const clean = opt.trim().replace(/['"]/g, "");
                        return <option key={clean} value={clean}>{clean}</option>;
                    })}
                </select>
            );
        }

        return (
            <Input
                type={spec.type === "number" ? "number" : "text"}
                value={String(value ?? "")}
                onChange={(e) => updateStepParam(stepIndex, key, e.target.value)}
                className="h-8 text-xs bg-slate-900 border-slate-700"
            />
        );
    };

    return (
        <div className="h-full flex overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 border-r border-slate-800 bg-slate-950 flex flex-col">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                    <h2 className="font-bold text-slate-200">My Recipes</h2>
                    <Button size="sm" variant="ghost" onClick={handleNewRecipe} title="New Recipe">
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {recipes.map(recipe => (
                        <div
                            key={recipe.id}
                            onClick={() => handleSelectRecipe(recipe)}
                            className={`p-3 rounded-lg text-sm cursor-pointer transition-colors ${activeRecipe?.id === recipe.id
                                    ? "bg-blue-600/20 text-blue-300 border border-blue-600/30"
                                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                                }`}
                        >
                            <div className="font-medium truncate">{recipe.name}</div>
                            <div className="text-[10px] text-slate-500 truncate">{recipe.steps.length} steps</div>
                        </div>
                    ))}
                    {recipes.length === 0 && (
                        <div className="text-center p-4 text-xs text-slate-600 italic">No recipes yet.</div>
                    )}
                </div>
            </div>

            {/* Main Area */}
            <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
                {activeRecipe ? (
                    <>
                        {/* Editor Header */}
                        <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex flex-col gap-4">
                            <div className="flex justify-between items-start">
                                <div className="space-y-2 flex-1 max-w-2xl">
                                    <Input
                                        className="text-lg font-bold bg-transparent border-transparent hover:border-slate-700 focus:border-slate-600 px-0 h-auto"
                                        value={activeRecipe.name}
                                        onChange={(e) => updateMetadata("name", e.target.value)}
                                        placeholder="Recipe Name"
                                    />
                                    <Input
                                        className="text-sm text-slate-400 bg-transparent border-transparent hover:border-slate-700 focus:border-slate-600 px-0 h-auto"
                                        value={activeRecipe.description || ""}
                                        onChange={(e) => updateMetadata("description", e.target.value)}
                                        placeholder="Description (optional)"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    {isDirty && <span className="text-xs text-amber-500 italic mr-2">Unsaved changes</span>}
                                    <Button variant="outline" size="sm" onClick={handleDelete} className="text-red-400 border-red-900/50 hover:bg-red-900/20">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" onClick={handleSave} className="bg-blue-600 hover:bg-blue-500 text-white">
                                        <Save className="h-4 w-4 mr-2" />
                                        Save Recipe
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* WORKSPACE */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-6">
                            {/* Steps List */}
                            <div className="max-w-3xl mx-auto space-y-4">
                                {activeRecipe.steps.length === 0 ? (
                                    <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-xl">
                                        <p className="text-slate-500 mb-2">Recipe is empty</p>
                                        <p className="text-xs text-slate-600">Add a step below to start building.</p>
                                    </div>
                                ) : (
                                    activeRecipe.steps.map((step, index) => {
                                        const template = getComputeTemplate(step.moduleKey);
                                        if (!template) return (
                                            <div key={step.id} className="p-4 border border-red-800 bg-red-900/10 text-red-400 rounded">
                                                Unknown Module: {step.moduleKey}
                                            </div>
                                        );

                                        return (
                                            <Card key={step.id} className="bg-slate-900 border-slate-700 shadow-sm relative group">
                                                <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-blue-900/30 text-blue-400 w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold border border-blue-500/30">
                                                            {index + 1}
                                                        </div>
                                                        <CardTitle className="text-sm font-medium text-slate-200">
                                                            {template.friendlyName || template.name}
                                                        </CardTitle>
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-500 hover:text-slate-300" onClick={() => moveStep(index, -1)} disabled={index === 0}>
                                                            <ArrowUp className="h-3 w-3" />
                                                        </Button>
                                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-500 hover:text-slate-300" onClick={() => moveStep(index, 1)} disabled={index === activeRecipe.steps.length - 1}>
                                                            <ArrowDown className="h-3 w-3" />
                                                        </Button>
                                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500 hover:text-red-400 hover:bg-red-900/20" onClick={() => removeStep(index)}>
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="p-4 pt-2">
                                                    {/* Params Form */}
                                                    {template.paramsSpec && Object.keys(template.paramsSpec).length > 0 ? (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/50 p-3 rounded border border-slate-800/50">
                                                            {Object.entries(template.paramsSpec).map(([key, spec]) => (
                                                                <div key={key} className="space-y-1.5">
                                                                    <Label className="text-[10px] text-slate-500 uppercase tracking-wider">{key}</Label>
                                                                    {renderParamInput(index, key, spec, step.params[key])}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-slate-600 italic">No parameters to configure.</p>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        );
                                    })
                                )}
                            </div>

                            {/* Add Step Button */}
                            <div className="max-w-3xl mx-auto pt-4 flex flex-col items-center">
                                <div className="h-8 w-[1px] bg-slate-800 mb-4"></div>
                                <div className="relative">
                                    <select
                                        className="appearance-none bg-blue-600 text-white pl-4 pr-10 py-2 rounded-full text-sm font-medium hover:bg-blue-500 cursor-pointer shadow-lg shadow-blue-900/20 transition-all active:scale-95"
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                addStep(e.target.value);
                                                e.target.value = "";
                                            }
                                        }}
                                        defaultValue=""
                                    >
                                        <option value="" disabled>+ Add Processing Step</option>
                                        {availableTemplates
                                            .filter(t => t.key !== "pipeline-runner") // Don't allow recursive pipeline capability yet
                                            .map(t => (
                                                <option key={t.key} value={t.key}>
                                                    {t.friendlyName || t.name}
                                                </option>
                                            ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <Plus className="h-4 w-4 text-blue-200" />
                                    </div>
                                </div>
                                <p className="mt-2 text-[10px] text-slate-600">Select a module to append to the chain</p>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
                        <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center mb-4">
                            <Settings className="h-8 w-8 text-slate-700" />
                        </div>
                        <p className="text-sm font-medium text-slate-500">Select a recipe to edit</p>
                        <p className="text-xs text-slate-700 mt-1">or create a new one</p>
                    </div>
                )}
            </div>
        </div>
    );
}
