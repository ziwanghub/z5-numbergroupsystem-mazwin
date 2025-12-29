
import React, { useState, useEffect } from "react";
import { X, Save, RotateCcw } from "lucide-react";
import { Recipe } from "../../services/recipeService";
import { Input } from "../ui/input";

interface EditRecipeModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipe: Recipe | null;
    onSave: (id: string, updates: { name: string; config: any }) => Promise<void>;
}

// Reusable Segmented Toggle (Inline)
const SegmentedToggle = ({
    options,
    value,
    onChange
}: {
    options: { label: string; value: any }[];
    value: any;
    onChange: (val: any) => void;
}) => {
    return (
        <div className="flex p-1 bg-slate-900 rounded-lg border border-slate-700 w-full relative">
            {options.map((opt, idx) => {
                const isActive = value === opt.value;
                return (
                    <button
                        key={idx}
                        onClick={() => onChange(opt.value)}
                        type="button"
                        className={`flex-1 text-[10px] sm:text-xs py-1.5 rounded-md font-medium transition-all relative z-10 ${isActive
                            ? "bg-blue-600 text-white shadow-sm"
                            : "text-slate-400 hover:text-slate-200"
                            }`}
                    >
                        {opt.label}
                    </button>
                );
            })}
        </div>
    );
};

export const EditRecipeModal = ({ isOpen, onClose, recipe, onSave }: EditRecipeModalProps) => {
    const [name, setName] = useState("");
    const [config, setConfig] = useState<any>({});
    const [saving, setSaving] = useState(false);

    // Initialize state when recipe opens
    useEffect(() => {
        if (isOpen && recipe) {
            setName(recipe.name);
            // Deep copy config to avoid reference issues
            setConfig(JSON.parse(JSON.stringify(recipe.config)));
        }
    }, [isOpen, recipe]);

    if (!isOpen || !recipe) return null;

    const handleSave = async () => {
        if (!name.trim()) return;
        setSaving(true);
        try {
            await onSave(recipe._id, { name, config });
            onClose();
        } finally {
            setSaving(false);
        }
    };

    const updateConfig = (key: string, val: any) => {
        setConfig((prev: any) => ({ ...prev, [key]: val }));
    };

    // Z-Master Logic Helper
    const toggleExclude = (field: 'excludeFront' | 'excludeBack', digit: string) => {
        const current = (config[field] || "").toString();
        const parts = current.split(',').map((s: string) => s.trim()).filter(Boolean);
        const set = new Set(parts);
        if (set.has(digit)) set.delete(digit);
        else set.add(digit);
        updateConfig(field, Array.from(set).join(','));
    };

    const ExcludeNumpad = ({ field, label }: { field: 'excludeFront' | 'excludeBack', label: string }) => {
        const currentStr = (config[field] || "").toString();
        const parts = currentStr.split(',').map((s: string) => s.trim());
        const activeSet = new Set(parts);
        return (
            <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400 font-mono">{label}</label>
                <div className="grid grid-cols-5 gap-1">
                    {['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => {
                        const active = activeSet.has(d);
                        return (
                            <button
                                key={d}
                                type="button"
                                onClick={() => toggleExclude(field, d)}
                                className={`text-[10px] font-mono h-6 rounded border transition-all ${active
                                    ? "bg-red-900/40 border-red-500/50 text-red-200"
                                    : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500"
                                    }`}
                            >
                                {d}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#0b1121] border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/50">
                    <div>
                        <h3 className="text-lg font-bold text-white">Edit Recipe</h3>
                        <p className="text-xs text-slate-400 font-mono">ID: {recipe.baseFormulaId}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* 1. Name */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Recipe Name</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-slate-900 border-slate-700"
                            placeholder="My Custom Recipe"
                        />
                    </div>

                    <div className="border-t border-slate-800/50 my-6"></div>

                    {/* 2. Configuration Source (Z-Master UI) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Settings Column */}
                        <div className="space-y-5">
                            <h4 className="text-sm font-semibold text-blue-400 uppercase tracking-widest mb-4">Parameters</h4>

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-400 font-mono">Base Digits</label>
                                <Input
                                    value={config['digits'] || ''}
                                    onChange={(e) => updateConfig('digits', e.target.value)}
                                    placeholder="0123456789"
                                    className="bg-slate-900 border-slate-700 h-9 text-xs font-mono tracking-widest"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-500 uppercase tracking-widest">Length</label>
                                <SegmentedToggle
                                    value={Number(config['length'] || 2)}
                                    onChange={(val) => updateConfig('length', val)}
                                    options={[
                                        { label: '2 Digits', value: 2 },
                                        { label: '3 Digits', value: 3 }
                                    ]}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-500 uppercase tracking-widest">Doubles Logic</label>
                                <SegmentedToggle
                                    value={config['allowDoubles'] !== false}
                                    onChange={(val) => updateConfig('allowDoubles', val)}
                                    options={[
                                        { label: 'Strict (No Double)', value: false },
                                        { label: 'Allow Double', value: true }
                                    ]}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-500 uppercase tracking-widest">Output Mode</label>
                                <SegmentedToggle
                                    value={config['sortUnique'] === true}
                                    onChange={(val) => updateConfig('sortUnique', val)}
                                    options={[
                                        { label: 'Sort (Permutation)', value: false },
                                        { label: 'Set (Combination)', value: true }
                                    ]}
                                />
                            </div>
                        </div>

                        {/* Exclusions Column */}
                        <div className="space-y-5">
                            <h4 className="text-sm font-semibold text-red-400 uppercase tracking-widest mb-4">Exclusions</h4>
                            <ExcludeNumpad field="excludeFront" label="Exclude Front Digit" />
                            <ExcludeNumpad field="excludeBack" label="Exclude Back Digit" />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-900/20 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {saving ? "Saving..." : (
                            <>
                                <Save className="w-4 h-4" />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
