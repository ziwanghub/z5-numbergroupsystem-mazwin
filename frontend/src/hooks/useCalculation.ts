// src/hooks/useCalculation.ts
import { useState } from 'react';
import { MathEngine, CalcMode } from '../lib/math-engine';
import { CalculationResult } from '../models/Calculation';
import { SIBLINGS, SEQUENCES_3 } from '../data/static-rules';

export const useCalculation = () => {
    const [input, setInput] = useState("");
    const [results, setResults] = useState<CalculationResult[]>([]);
    const [isCalculating, setIsCalculating] = useState(false);

    const predict = async (inputValue: string) => {
        setIsCalculating(true);
        setInput(inputValue.trim()); // Update State

        // Simulate Calculation Delay
        await new Promise(resolve => setTimeout(resolve, 300));

        // 1. Process Input
        const digits = MathEngine.parseDigits(inputValue);

        if (digits.length < 2) {
            setResults([]);
            setIsCalculating(false);
            return;
        }

        // 2. Generate Logic (Mock Panels for Phase I)
        const panel1Strings = MathEngine.calculate(digits, 2, 'C', false);
        const panel2Strings = MathEngine.calculate(digits, 3, 'C', false);
        const panel3Strings = MathEngine.calculate(digits, 2, 'P', false);

        // Static Check: Find Siblings that match input digits? 
        // For this mock, we just return the full SIBLINGS set if input has '0' and '1'
        let panel4Strings: string[] = [];
        if (digits.includes('0') && digits.includes('1')) {
            panel4Strings = [...SIBLINGS];
        } else {
            panel4Strings = ["No Static Match"];
        }


        const newResults: CalculationResult[] = [
            {
                id: 'p1',
                type: 'dynamic',
                title: '2-Digit Combinations',
                data: panel1Strings,
                config: { size: 2, mode: 'C', allowDouble: false },
                stats: { count: panel1Strings.length }
            },
            {
                id: 'p2',
                type: 'dynamic',
                title: '3-Digit Combinations',
                data: panel2Strings,
                config: { size: 3, mode: 'C', allowDouble: false },
                stats: { count: panel2Strings.length }
            },
            {
                id: 'p3',
                type: 'dynamic',
                title: '2-Digit Permutations',
                data: panel3Strings,
                config: { size: 2, mode: 'P', allowDouble: false },
                stats: { count: panel3Strings.length }
            },
            {
                id: 'p4',
                type: 'static',
                title: 'Static Matches (Siblings)',
                data: panel4Strings,
                stats: { count: panel4Strings.length }
            }
        ];

        setResults(newResults);
        setIsCalculating(false);
    };

    return {
        input,
        setInput,
        results,
        isCalculating,
        predict
    };
};
