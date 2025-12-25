// src/lib/math-engine.ts

export type CalcMode = 'C' | 'P'; // Combination | Permutation

export const MathEngine = {
    // Utility: Parse input string into unique digits array
    parseDigits: (input: string): string[] => {
        return Array.from(new Set(input.replace(/\D/g, '').split(''))).sort();
    },

    // Core: Generate numbers based on formula
    calculate: (digits: string[], size: 2 | 3, mode: CalcMode, allowDouble: boolean): string[] => {
        const results: string[] = [];

        // Recursive function to generate combinations/permutations
        const generate = (current: string[], remaining: string[]) => {
            if (current.length === size) {
                results.push(current.join(''));
                return;
            }

            for (let i = 0; i < remaining.length; i++) {
                const char = remaining[i];

                // Mode C: Next digit must be from next index onwards (no reuse, specific order doesn't matter for generation flow but results are usually unique sets)
                // Mode P: Can use any remaining digit (but here we are doing simple permutations of the INPUT digits)

                // Simplified Logic for "Run Numbers":
                // This engine typically expects to generate variations from the input digits.

                let nextRemaining: string[] = [];
                if (mode === 'C') {
                    // For Combination, order doesn't matter (12 is same as 21), usually we sort. 
                    // But if we generate from input '123' size 2: 12, 13, 23.
                    nextRemaining = remaining.slice(i + 1);
                } else {
                    // For Permutation '123' size 2: 12, 13, 21, 23, 31, 32.
                    nextRemaining = remaining.filter((_, idx) => idx !== i);
                }

                generate([...current, char], nextRemaining);
            }
        };

        // If allowDouble is true, we need a different approach (reusing digits)
        const generateWithDoubles = (current: string[]) => {
            if (current.length === size) {
                results.push(current.join(''));
                return;
            }

            for (let i = 0; i < digits.length; i++) {
                generateWithDoubles([...current, digits[i]]);
            }
        };

        if (allowDouble) {
            generateWithDoubles([]);
        } else {
            generate([], digits);
        }

        return results.sort();
    }
};
