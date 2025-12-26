import { FormulaCapabilities, FormulaVersionStatus } from "../models/Formula";

export const resolveFormulaCapabilities = (
    status: FormulaVersionStatus,
    isLocked?: boolean
): FormulaCapabilities => {
    switch (status) {
        case "draft":
            return {
                canCompute: true,
                canCopy: false,
                requiresConsent: false,
                isBlocked: false,
                severity: "warn",
                message: "Testing / Preview only"
            };
        case "active":
            return {
                canCompute: true,
                canCopy: true,
                requiresConsent: false,
                isBlocked: false,
                severity: "info",
                message: isLocked ? "Locked" : "Active"
            };
        case "deprecated":
            return {
                canCompute: true,
                canCopy: false,
                requiresConsent: true,
                isBlocked: false,
                severity: "warn",
                message: "Deprecated — consent required"
            };
        case "archived":
            return {
                canCompute: false,
                canCopy: false,
                requiresConsent: false,
                isBlocked: true,
                severity: "block",
                message: "Archived — panel disabled"
            };
        default:
            return {
                canCompute: true,
                canCopy: true,
                requiresConsent: false,
                isBlocked: false,
                severity: "info"
            };
    }
};
