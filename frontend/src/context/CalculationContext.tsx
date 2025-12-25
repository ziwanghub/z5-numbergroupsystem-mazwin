import { createContext, useContext, useState, ReactNode } from 'react';
import { CalculationResult } from '../models/Calculation';
import { MathEngine } from '../lib/math-engine';
import { SIBLINGS } from '../data/static-rules';

interface CalculationContextType {
    input: string;
    setInput: (val: string) => void;
    results: CalculationResult[];
    isCalculating: boolean;
    config: {
        maxLength: number;
    };
    predict: (val: string) => Promise<void>;
}

const CalculationContext = createContext<CalculationContextType | undefined>(undefined);

export function CalculationProvider({ children }: { children: ReactNode }) {
    const [input, setInputState] = useState("");
    const [results, setResults] = useState<CalculationResult[]>([]);
    const [isCalculating, setIsCalculating] = useState(false);
    const [config] = useState({ maxLength: 10 });

    const predict = async (inputValue: string) => {
        setIsCalculating(true);

        // Simulate Calculation Delay (thinner than before for real-time feel)
        await new Promise(resolve => setTimeout(resolve, 150));

        const digits = MathEngine.parseDigits(inputValue);

        if (digits.length < 2) {
            setResults([]);
            setIsCalculating(false);
            return;
        }

        // Logic Reuse (Phase I Logic)
        const panel1Strings = MathEngine.calculate(digits, 2, 'C', false);
        const panel2Strings = MathEngine.calculate(digits, 3, 'C', false);
        const panel3Strings = MathEngine.calculate(digits, 2, 'P', false);

        let panel4Strings: string[] = [];
        if (digits.includes('0') && digits.includes('1')) {
            panel4Strings = [...SIBLINGS]; // Mock Logic
        } else {
            panel4Strings = [];
        }

        const newResults: CalculationResult[] = [
            {
                id: 'p1', type: 'dynamic', title: '2-Digit Combinations',
                data: panel1Strings, config: { size: 2, mode: 'C', allowDouble: false },
                stats: { count: panel1Strings.length }
            },
            {
                id: 'p2', type: 'dynamic', title: '3-Digit Combinations',
                data: panel2Strings, config: { size: 3, mode: 'C', allowDouble: false },
                stats: { count: panel2Strings.length }
            },
            {
                id: 'p3', type: 'dynamic', title: '2-Digit Permutations',
                data: panel3Strings, config: { size: 2, mode: 'P', allowDouble: false },
                stats: { count: panel3Strings.length }
            },
            {
                id: 'p4', type: 'static', title: 'Static Matches (Siblings)',
                data: panel4Strings,
                stats: { count: panel4Strings.length }
            }
        ];

        setResults(newResults);
        setIsCalculating(false);
    };

    const setInput = (val: string) => {
        setInputState(val);
    };

    return (
        <CalculationContext.Provider value={{ input, setInput, results, isCalculating, config, predict }}>
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
