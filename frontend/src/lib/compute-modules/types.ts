import { FormulaEntry, FormulaGuardrails, FormulaDefinition } from "../../models/Formula";

export interface ComputeTemplate {
    key: string;
    name: string;
    friendlyName?: string; // e.g., "จับคู่ไม่ซ้ำ"
    description: string;
    formulaText: string;
    paramsSpec: FormulaEntry["versions"][number]["inputSpec"]["params"];
    inputSpec: FormulaEntry["versions"][number]["inputSpec"];
    outputSpec: FormulaEntry["versions"][number]["outputSpec"];
    guardrails: FormulaGuardrails;
    estimate?: FormulaDefinition["estimate"];
    compute: FormulaDefinition["compute"];
}
