// Individual exports for direct use if needed
export const SIBLINGS = [
    "01", "12", "23", "34", "45", "56", "67", "78", "89", "90"
];

export const DOUBLES = [
    "00", "11", "22", "33", "44", "55", "66", "77", "88", "99"
];

export const MIRRORS = [
    "000", "111", "222", "333", "444", "555", "666", "777", "888", "999"
];

// Unified Export
export const STATIC_RULES: Record<string, { title: string; data: string[] }> = {
    SIBLINGS: { title: "Siblings (01, 12...)", data: SIBLINGS },
    DOUBLES: { title: "Doubles (00, 11...)", data: DOUBLES },
    MIRRORS: { title: "Mirrors (XYZ)", data: MIRRORS }
};
