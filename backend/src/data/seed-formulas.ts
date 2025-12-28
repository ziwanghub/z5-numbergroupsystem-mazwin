// SYSTEM FORMULAS
export const SYSTEM_FORMULAS = [
  {
    id: "z-master-universal-v1",
    displayName: "Z-Master: Universal Generator",
    description: "The ultimate number generator with filters for Doubles, Triplets, Front/Back exclusion, and Sorting.",
    tags: ["generator", "universal", "z-master", "advanced"],
    status: "ACTIVE",
    version: "1.0.0",
    computeKey: "z_master_v1",
    inputSpec: {
      type: "object",
      properties: {
        digits: { type: "string", title: "Base Digits", default: "0123456789" },
        length: { type: "number", title: "Length", default: 2 },
        allowDoubles: { type: "boolean", title: "Allow Doubles (11, 22)", default: true },
        sortUnique: { type: "boolean", title: "Sort Pair (10=01)", default: false },
        excludeFront: { type: "string", title: "Exclude Front Digits", default: "" },
        excludeBack: { type: "string", title: "Exclude Back Digits", default: "" },
        limit: { type: "number", title: "Limit", default: 20000 }
      },
      required: ["digits", "length"]
    },
    outputSpec: {
      type: "array",
      items: { type: "string" }
    },
    guardrails: {
      maxN: 50000,
      maxK: 6,
      maxGroupsEstimate: 50000
    },
    logic: `

// Z-Master Universal Generator Logic (Engine v10: SPIC-IME/ISI)

// --- HELPER FUNCTIONS ---

const toArray = (input) => Array.from(input);
const uniqPool = (input) => Array.from(new Set(input)); // Preserves insertion order

// 1. SPIC-BASE: Combinations No Repetition (Mode C, No Double)
// "Standard Position Independent Combination"
function spicBase(source, k) {
    const pool = uniqPool(source);
    const result = [];
    
    function combine(start, current) {
        if (current.length === k) {
            result.push(current.join(''));
            return;
        }
        for (let i = start; i < pool.length; i++) {
            combine(i + 1, current.concat(pool[i]));
        }
    }
    
    combine(0, []);
    return result;
}

// 2. SPIC-ISI-INJECT: Combinations With Repetition (Mode C, Allow Double)
// "Inject Self Injection" - Allows current index to be reused
function spicIsiInject(source, k) {
    const pool = uniqPool(source);
    const result = [];
    
    function combine(start, current) {
        if (current.length === k) {
            result.push(current.join(''));
            return;
        }
        for (let i = start; i < pool.length; i++) {
            // Inject self: Use 'i' again instead of 'i + 1'
            combine(i, current.concat(pool[i]));
        }
    }
    
    combine(0, []);
    return result;
}

// 3. PERMS-NO-REP: Permutations No Repetition (Mode P, No Double)
function permsNoRep(source, k) {
    const pool = uniqPool(source);
    const result = [];
    
    function permute(current, remaining) {
        if (current.length === k) {
            result.push(current.join(''));
            return;
        }
        for (let i = 0; i < remaining.length; i++) {
            const next = remaining[i];
            const left = remaining.slice(0, i).concat(remaining.slice(i + 1));
            permute(current.concat(next), left);
        }
    }
    
    permute([], pool);
    return result;
}

// 4. PERMS-WITH-REP: Permutations With Repetition (Mode P, Allow Double)
// "Standard Multiplex Permutation"
function permsWithRep(source, k) {
    const pool = uniqPool(source); // Base pool unique, but we allow reuse
    const result = [];
    
    function permute(current) {
        if (current.length === k) {
            result.push(current.join(''));
            return;
        }
        for (let i = 0; i < pool.length; i++) {
            permute(current.concat(pool[i]));
        }
    }
    
    permute([]);
    return result;
}


// --- MAIN EXECUTION ---

// 1. Parse Inputs
const digits = inputs.digits || "0123456789";
const k = parseInt(inputs.length) || 2;
// In Z-Master V2 UI: sortUnique=true is MODE C (Set), false is MODE P (Sort/Perm)
// allowDoubles=false is "No Double", true is "Allow Double"
const isModeC = inputs.sortUnique === true || inputs.sortUnique === "true"; 
const allowDoubles = inputs.allowDoubles === true || inputs.allowDoubles === "true";

// Parsed exclusions
const excludeFrontSet = new Set((inputs.excludeFront || "").split(",").map(s => s.trim()).filter(Boolean));
const excludeBackSet = new Set((inputs.excludeBack || "").split(",").map(s => s.trim()).filter(Boolean));

// 2. Route to Engine v10 Functions
let rawResults = [];

if (isModeC) {
    // COMBINATION (Set)
    // SPIC uses raw input array (preserving order)
    if (!allowDoubles) rawResults = spicBase(digits, k);
    else rawResults = spicIsiInject(digits, k);
} else {
    // PERMUTATION (Sort/Order)
    const pool = uniqPool(digits); // Use unique pool for perms base usually
    if (!allowDoubles) rawResults = permsNoRep(digits, k);
    else rawResults = permsWithRep(digits, k);
}

// 3. Apply Exclusions & Return
// We filter the generated results based on UI exclusions
if (excludeFrontSet.size === 0 && excludeBackSet.size === 0) {
    return rawResults;
}

return rawResults.filter(item => {
    // Exclude Front
    if (excludeFrontSet.size > 0) {
        if (excludeFrontSet.has(item[0])) return false;
    }
    // Exclude Back
    if (excludeBackSet.size > 0 && item.length > 0) {
        if (excludeBackSet.has(item[item.length - 1])) return false;
    }
    return true;
});
`
  }
];
