import React, { createContext, useContext, ReactNode, useEffect, useReducer, useCallback } from 'react';
import { CalculationResult } from '../models/Calculation';
import { WidgetConfig } from '../models/Widget';
import { MathEngine } from '../lib/math-engine';
import { getFormula, getLatestFormula } from '../lib/formula-registry';
import { runFormulaWithGuardrails } from '../lib/formula-runtime';
import { toast } from "sonner";
import { resolveFormulaCapabilities } from "../lib/formula-policy";

// --- Types ---
interface CalculationConfig {
    maxLength: number;
}

interface CalculationState {
    input: string;
    results: CalculationResult[];
    isCalculating: boolean;
    config: CalculationConfig;
    widgets: WidgetConfig[]; // Dynamic Widgets
}

// Actions
type Action =
    | { type: 'SET_INPUT'; payload: string }
    | { type: 'SET_CALCULATING'; payload: boolean }
    | { type: 'ADD_WIDGET'; payload: Omit<WidgetConfig, 'id'> }
    | { type: 'REMOVE_WIDGET'; payload: string }
    | { type: 'RESET_LAYOUT' }
    | { type: 'CALCULATE_RESULTS'; payload: string };

// Context Interface
interface CalculationContextType extends CalculationState {
    isReady: boolean;
    lastCopy: {
        panelId: string;
        panelName: string;
        copiedAt: number;
    } | null;
    setInput: (val: string) => void;
    predict: (val: string) => void;
    addWidget: (config: Omit<WidgetConfig, 'id'>) => void;
    removeWidget: (id: string) => void;
    resetLayout: () => void;
    setLastCopy: (copy: { panelId: string; panelName: string; copiedAt: number }) => void;
}

// --- Default Defaults ---
const DEFAULT_WIDGETS: WidgetConfig[] = [
    {
        id: 'default-1',
        title: '2 Digits (No Double)',
        formulaId: 'digits-group',
        formulaVersion: '1.0.0',
        params: { size: 2, mode: 'C', allowDouble: false }
    },
    {
        id: 'default-2',
        title: '3 Digits (No Double)',
        formulaId: 'digits-group',
        formulaVersion: '1.0.0',
        params: { size: 3, mode: 'C', allowDouble: false }
    },
    {
        id: 'default-3',
        title: '2 Digits (Permutation)',
        formulaId: 'digits-group',
        formulaVersion: '1.0.0',
        params: { size: 2, mode: 'P', allowDouble: false }
    },
    {
        id: 'default-4',
        title: 'Siblings (Static)',
        formulaId: 'static-group',
        formulaVersion: '1.0.0',
        params: { groupKey: 'SIBLINGS' }
    },
];

const normalizeWidgetConfig = (widget: WidgetConfig): WidgetConfig => {
    if (widget.formulaId && widget.formulaVersion && widget.params) {
        return { ...widget, params: widget.params || {} };
    }

    if (widget.rules?.staticGroupKey) {
        return {
            ...widget,
            formulaId: "static-group",
            formulaVersion: "1.0.0",
            params: { groupKey: widget.rules.staticGroupKey }
        };
    }

    if (widget.rules) {
        return {
            ...widget,
            formulaId: "digits-group",
            formulaVersion: "1.0.0",
            params: {
                size: widget.rules.size,
                mode: widget.rules.mode,
                allowDouble: widget.rules.allowDouble
            }
        };
    }

    return {
        ...widget,
        formulaId: widget.formulaId || "digits-group",
        formulaVersion: widget.formulaVersion || "1.0.0",
        params: widget.params || {}
    };
};

const INITIAL_STATE: CalculationState = {
    input: '',
    results: [],
    isCalculating: false,
    config: { maxLength: 10 },
    widgets: DEFAULT_WIDGETS,
};

// --- Reducer ---
const calculationReducer = (state: CalculationState, action: Action): CalculationState => {
    switch (action.type) {
        case 'SET_INPUT':
            return { ...state, input: action.payload };

        case 'SET_CALCULATING':
            return { ...state, isCalculating: action.payload };

        case 'CALCULATE_RESULTS': {
            const inputVal = action.payload;
            const digits = MathEngine.parseDigits(inputVal);

            // If input is too short, clear results
            if (digits.length < 2) {
                return { ...state, results: [], isCalculating: false };
            }

            // Centralized Calculation Logic
            const newResults: CalculationResult[] = state.widgets.map(widget => {
                const { formulaId, formulaVersion, params } = widget;
                let formula = getFormula(formulaId, formulaVersion);
                let usedVersion = formulaVersion;

                if (!formula) {
                    const latest = getLatestFormula(formulaId);
                    if (latest) {
                        formula = latest;
                        usedVersion = latest.version;
                        toast.warning("Formula updated", {
                            description: `${widget.title} using latest version.`,
                            id: "formula-version"
                        });
                    }
                }

                if (!formula) {
                    toast.warning("Formula unavailable", {
                        description: `${widget.title} is not available.`,
                        id: "formula-missing"
                    });
                    return {
                        id: widget.id,
                        title: `${widget.title} (Unavailable)`,
                        resultType: 'dynamic',
                        data: [],
                        total: 0
                    };
                }

                const capabilities = resolveFormulaCapabilities(formula.status, formula.isLocked);

                if (!capabilities.canCompute || capabilities.isBlocked) {
                    return {
                        id: widget.id,
                        title: widget.title,
                        resultType: formulaId === "static-group" ? 'static' : 'dynamic',
                        data: [],
                        total: 0,
                        formulaId,
                        formulaVersion: usedVersion,
                        capabilities
                    };
                }

                const runtimeResult = runFormulaWithGuardrails(formula, {
                    digits,
                    params: params || {}
                });

                if (runtimeResult.status === "blocked") {
                    toast.warning("Computation blocked", {
                        description: runtimeResult.reason || "Computation exceeds limits.",
                        id: "formula-guard"
                    });
                }

                return {
                    id: widget.id,
                    title: widget.title,
                    resultType: formulaId === "static-group" ? 'static' : 'dynamic',
                    data: runtimeResult.status === "ok" ? runtimeResult.data : [],
                    total: runtimeResult.status === "ok" ? runtimeResult.data.length : 0,
                    formulaId,
                    formulaVersion: usedVersion,
                    capabilities
                };
            });

            return { ...state, results: newResults, isCalculating: false };
        }

        case 'ADD_WIDGET':
            const newWidget: WidgetConfig = {
                ...action.payload,
                id: crypto.randomUUID()
            };
            return { ...state, widgets: [...state.widgets, normalizeWidgetConfig(newWidget)] };

        case 'REMOVE_WIDGET':
            return { ...state, widgets: state.widgets.filter(w => w.id !== action.payload) };

        case 'RESET_LAYOUT':
            return { ...state, widgets: DEFAULT_WIDGETS };

        default:
            return state;
    }
};

const CalculationContext = createContext<CalculationContextType | undefined>(undefined);

export function CalculationProvider({ children }: { children: ReactNode }) {
    // Initialize state from LocalStorage or Default
    const [state, dispatch] = useReducer(calculationReducer, INITIAL_STATE, (defaultState) => {
        const savedWidgets = localStorage.getItem('z5_workspace_widgets');
        if (savedWidgets) {
            try {
                const parsed = JSON.parse(savedWidgets) as WidgetConfig[];
                return { ...defaultState, widgets: parsed.map(normalizeWidgetConfig) };
            } catch (e) {
                console.error("Failed to load workspace widgets", e);
                return defaultState;
            }
        }
        return defaultState;
    });
    const [lastCopy, setLastCopy] = React.useState<{
        panelId: string;
        panelName: string;
        copiedAt: number;
    } | null>(null);

    // Persistence Effect
    useEffect(() => {
        localStorage.setItem('z5_workspace_widgets', JSON.stringify(state.widgets));
    }, [state.widgets]);

    // Actions Wrappers
    const setInput = (val: string) => dispatch({ type: 'SET_INPUT', payload: val });

    const predict = useCallback((val: string) => {
        dispatch({ type: 'SET_CALCULATING', payload: true });

        // Immediate calculation (debounce handled in SmartInput)
        setTimeout(() => {
            dispatch({ type: 'CALCULATE_RESULTS', payload: val });
        }, 0);
    }, []);

    const addWidget = (config: Omit<WidgetConfig, 'id'>) => dispatch({ type: 'ADD_WIDGET', payload: config });
    const removeWidget = (id: string) => dispatch({ type: 'REMOVE_WIDGET', payload: id });
    const resetLayout = () => dispatch({ type: 'RESET_LAYOUT' });
    const isReady = !state.isCalculating && state.results.length > 0;

    // Recalculate when widgets change (if there is input)
    useEffect(() => {
        if (state.input) {
            predict(state.input);
        }
    }, [state.widgets.length, predict, state.input]);

    return (
        <CalculationContext.Provider value={{
            ...state,
            isReady,
            lastCopy,
            setInput,
            predict,
            addWidget,
            removeWidget,
            resetLayout,
            setLastCopy
        }}>
            {children}
        </CalculationContext.Provider>
    );
}

export function useCalculationContext() {
    const context = useContext(CalculationContext);
    if (context === undefined) {
        throw new Error('useCalculationContext must be used within a CalculationProvider');
    }
    return context;
}
